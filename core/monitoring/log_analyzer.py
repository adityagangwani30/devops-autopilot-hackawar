"""
Log Analysis Module for Monitoring System
Handles log ingestion, pattern matching, anomaly detection, and alert generation
"""
import re
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib

logger = logging.getLogger(__name__)

class AlertSeverity(Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class LogEntry:
    """Data class for log entries"""
    timestamp: datetime
    service: str
    level: str
    message: str
    raw_log: str
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

@dataclass
class Alert:
    """Data class for alerts"""
    id: str
    timestamp: datetime
    severity: AlertSeverity
    title: str
    description: str
    service: str
    log_entries: List[LogEntry]
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

class LogPatternMatcher:
    """Handles pattern matching for log analysis"""
    
    def __init__(self):
        self.compiled_patterns = {}
    
    def add_pattern(self, name: str, pattern: str, flags: int = 0):
        """
        Add a regex pattern for matching
        
        Args:
            name: Identifier for the pattern
            pattern: Regex pattern string
            flags: Regex flags (default: 0)
        """
        try:
            compiled = re.compile(pattern, flags)
            self.compiled_patterns[name] = compiled
            logger.debug(f"Added pattern '{name}': {pattern}")
        except re.error as e:
            logger.error(f"Invalid regex pattern '{pattern}': {str(e)}")
            raise
    
    def matches(self, text: str) -> List[str]:
        """
        Check which patterns match the given text
        
        Args:
            text: Text to match against patterns
            
        Returns:
            List of pattern names that matched
        """
        matches = []
        for name, pattern in self.compiled_patterns.items():
            if pattern.search(text):
                matches.append(name)
        return matches

class LogAnalyzer:
    """Main log analysis engine"""
    
    def __init__(self):
        self.pattern_matcher = LogPatternMatcher()
        self.alert_handlers: List[Callable[[Alert], None]] = []
        self.log_buffer: List[LogEntry] = []
        self.max_buffer_size = 10000
        
        # Add common error patterns
        self._add_default_patterns()
    
    def _add_default_patterns(self):
        """Add default patterns for common error conditions"""
        # Java exceptions
        self.pattern_matcher.add_pattern(
            "java_exception",
            r"Exception|Error.*at\s+\w+\.\w+",
            re.IGNORECASE
        )
        
        # Python exceptions
        self.pattern_matcher.add_pattern(
            "python_exception",
            r"Traceback\s+\(most recent call last\):|Exception:\s+\w+Error",
            re.IGNORECASE
        )
        
        # Database errors
        self.pattern_matcher.add_pattern(
            "database_error",
            r"ORA-\d+|SQL\s+State:|ERROR:\s+relation\s+\"|\w+\"\s+does not exist",
            re.IGNORECASE
        )
        
        # Network/Connection errors
        self.pattern_matcher.add_pattern(
            "connection_error",
            r"Connection\s+(refused|timeout|reset)|Unable\s+to\s+connect|Network\s+is\s+unreachable",
            re.IGNORECASE
        )
        
        # Memory/Resource errors
        self.pattern_matcher.add_pattern(
            "memory_error",
            r"OutOfMemoryError|Cannot\s+allocate\s+memory|Memory\s+exhausted",
            re.IGNORECASE
        )
        
        # Authentication/Authorization errors
        self.pattern_matcher.add_pattern(
            "auth_error",
            r"Unauthorized|Access\s+denied|Invalid\s+credentials|Authentication\s+failed",
            re.IGNORECASE
        )
    
    def add_alert_handler(self, handler: Callable[[Alert], None]):
        """
        Add a handler function to be called when alerts are generated
        
        Args:
            handler: Function that takes an Alert object
        """
        self.alert_handlers.append(handler)
        logger.debug("Added alert handler")
    
    def parse_log_entry(self, raw_log: str, service: str = "unknown") -> Optional[LogEntry]:
        """
        Parse a raw log line into a LogEntry object
        
        Args:
            raw_log: Raw log string
            service: Service name that generated the log
            
        Returns:
            LogEntry object or None if parsing fails
        """
        try:
            # Try to parse as JSON first
            if raw_log.strip().startswith('{') and raw_log.strip().endswith('}'):
                try:
                    log_data = json.loads(raw_log.strip())
                    timestamp_str = log_data.get('timestamp', log_data.get('time', ''))
                    level = log_data.get('level', log_data.get('severity', 'INFO'))
                    message = log_data.get('message', log_data.get('msg', raw_log))
                    
                    # Parse timestamp
                    timestamp = self._parse_timestamp(timestamp_str)
                    
                    # Extract metadata (everything except standard fields)
                    metadata = {k: v for k, v in log_data.items() 
                              if k not in ['timestamp', 'time', 'level', 'severity', 'message', 'msg']}
                    
                    return LogEntry(
                        timestamp=timestamp,
                        service=service,
                        level=level.upper(),
                        message=str(message),
                        raw_log=raw_log,
                        metadata=metadata
                    )
                except json.JSONDecodeError:
                    pass  # Fall through to plain text parsing
            
            # Plain text parsing (simple approach)
            # Extract timestamp if present at the beginning
            timestamp_match = re.match(r'(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:\s*[Z+-]\d{2}:\d{2})?)', raw_log)
            if timestamp_match:
                timestamp_str = timestamp_match.group(1)
                timestamp = self._parse_timestamp(timestamp_str)
                # Remove timestamp from message
                message = raw_log[timestamp_match.end():].strip()
            else:
                timestamp = datetime.utcnow()
                message = raw_log
            
            # Extract level if present
            level_match = re.search(r'\b(DEBUG|INFO|WARNING|WARN|ERROR|CRITICAL|FATAL)\b', message, re.IGNORECASE)
            level = level_match.group(1).upper() if level_match else 'INFO'
            if level == 'WARN':
                level = 'WARNING'
            
            return LogEntry(
                timestamp=timestamp,
                service=service,
                level=level,
                message=message,
                raw_log=raw_log
            )
            
        except Exception as e:
            logger.warning(f"Failed to parse log entry: {str(e)}")
            return None
    
    def _parse_timestamp(self, timestamp_str: str) -> datetime:
        """
        Parse timestamp string into datetime object
        
        Args:
            timestamp_str: Timestamp string
            
        Returns:
            datetime object
        """
        if not timestamp_str:
            return datetime.utcnow()
        
        # Try common timestamp formats
        formats = [
            '%Y-%m-%dT%H:%M:%S',
            '%Y-%m-%dT%H:%M:%S.%f',
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d %H:%M:%S.%f',
            '%Y-%m-%dT%H:%M:%SZ',
            '%Y-%m-%dT%H:%M:%S.%fZ'
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(timestamp_str, fmt)
            except ValueError:
                continue
        
        # If none worked, return current time
        logger.warning(f"Could not parse timestamp '{timestamp_str}', using current time")
        return datetime.utcnow()
    
    def analyze_log_entry(self, log_entry: LogEntry) -> List[Alert]:
        """
        Analyze a single log entry and generate alerts if needed
        
        Args:
            log_entry: LogEntry to analyze
            
        Returns:
            List of Alert objects generated from this log entry
        """
        alerts = []
        
        # Add to buffer
        self.log_buffer.append(log_entry)
        if len(self.log_buffer) > self.max_buffer_size:
            self.log_buffer.pop(0)  # Remove oldest entry
        
        # Check for pattern matches
        matched_patterns = self.pattern_matcher.matches(log_entry.message)
        matched_patterns.extend(self.pattern_matcher.matches(log_entry.raw_log))
        
        if matched_patterns:
            # Determine severity based on patterns and log level
            severity = self._determine_severity(log_entry.level, matched_patterns)
            
            # Generate alert ID
            alert_id = self._generate_alert_id(log_entry, matched_patterns)
            
            alert = Alert(
                id=alert_id,
                timestamp=log_entry.timestamp,
                severity=severity,
                title=f"{log_entry.service}: {', '.join(matched_patterns)}",
                description=f"Log pattern matched: {', '.join(matched_patterns)}",
                service=log_entry.service,
                log_entries=[log_entry],
                metadata={
                    'matched_patterns': matched_patterns,
                    'log_level': log_entry.level
                }
            )
            
            alerts.append(alert)
        
        return alerts
    
    def _determine_severity(self, log_level: str, patterns: List[str]) -> AlertSeverity:
        """
        Determine alert severity based on log level and matched patterns
        
        Args:
            log_level: Log level from the log entry
            patterns: List of matched pattern names
            
        Returns:
            AlertSeverity enum value
        """
        # Map log levels to severities
        level_to_severity = {
            'DEBUG': AlertSeverity.INFO,
            'INFO': AlertSeverity.INFO,
            'WARNING': AlertSeverity.WARNING,
            'WARN': AlertSeverity.WARNING,
            'ERROR': AlertSeverity.ERROR,
            'CRITICAL': AlertSeverity.CRITICAL,
            'FATAL': AlertSeverity.CRITICAL
        }
        
        base_severity = level_to_severity.get(log_level, AlertSeverity.INFO)
        
        # Increase severity based on critical patterns
        critical_patterns = ['java_exception', 'python_exception', 'memory_error', 'connection_error']
        if any(p in critical_patterns for p in patterns):
            if base_severity == AlertSeverity.INFO:
                base_severity = AlertSeverity.WARNING
            elif base_severity == AlertSeverity.WARNING:
                base_severity = AlertSeverity.ERROR
            elif base_severity == AlertSeverity.ERROR:
                base_severity = AlertSeverity.CRITICAL
        
        return base_severity
    
    def _generate_alert_id(self, log_entry: LogEntry, patterns: List[str]) -> str:
        """
        Generate a unique ID for an alert
        
        Args:
            log_entry: LogEntry that triggered the alert
            patterns: List of matched patterns
            
        Returns:
            Unique alert ID string
        """
        # Create a hash based on service, patterns, and time bucket (to group similar alerts)
        time_bucket = log_entry.timestamp.replace(minute=0, second=0, microsecond=0)
        hash_input = f"{log_entry.service}:{','.join(sorted(patterns))}:{time_bucket.isoformat()}"
        return hashlib.md5(hash_input.encode()).hexdigest()[:12]
    
    def process_logs(self, raw_logs: List[str], service: str = "unknown") -> List[Alert]:
        """
        Process multiple log entries and generate alerts
        
        Args:
            raw_logs: List of raw log strings
            service: Service name generating the logs
            
        Returns:
            List of Alert objects generated
        """
        alerts = []
        for raw_log in raw_logs:
            log_entry = self.parse_log_entry(raw_log, service)
            if log_entry:
                entry_alerts = self.analyze_log_entry(log_entry)
                alerts.extend(entry_alerts)
        
        # Trigger alert handlers
        for alert in alerts:
            for handler in self.alert_handlers:
                try:
                    handler(alert)
                except Exception as e:
                    logger.error(f"Error in alert handler: {str(e)}")
        
        return alerts
    
    def get_recent_logs(self, minutes: int = 60) -> List[LogEntry]:
        """
        Get log entries from the last N minutes
        
        Args:
            minutes: Number of minutes to look back
            
        Returns:
            List of LogEntry objects
        """
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)
        return [entry for entry in self.log_buffer if entry.timestamp >= cutoff_time]
    
    def get_log_stats(self) -> Dict[str, Any]:
        """
        Get statistics about processed logs
        
        Returns:
            Dictionary with log statistics
        """
        if not self.log_buffer:
            return {
                'total_logs': 0,
                'logs_by_level': {},
                'logs_by_service': {},
                'time_range': None
            }
        
        # Count by level
        level_counts = {}
        service_counts = {}
        
        for entry in self.log_buffer:
            level_counts[entry.level] = level_counts.get(entry.level, 0) + 1
            service_counts[entry.service] = service_counts.get(entry.service, 0) + 1
        
        # Time range
        timestamps = [entry.timestamp for entry in self.log_buffer]
        time_range = {
            'start': min(timestamps).isoformat() if timestamps else None,
            'end': max(timestamps).isoformat() if timestamps else None
        }
        
        return {
            'total_logs': len(self.log_buffer),
            'logs_by_level': level_counts,
            'logs_by_service': service_counts,
            'time_range': time_range
        }

# Example alert handler that prints to console
def console_alert_handler(alert: Alert):
    """Example alert handler that prints to console"""
    print(f"[{alert.severity.value.upper()}] {alert.title}")
    print(f"  Time: {alert.timestamp.isoformat()}")
    print(f"  Service: {alert.service}")
    print(f"  Description: {alert.description}")
    print("-" * 50)

# Example usage
def example_usage():
    """Example of how to use the LogAnalyzer"""
    analyzer = LogAnalyzer()
    
    # Add console alert handler
    analyzer.add_alert_handler(console_alert_handler)
    
    # Sample logs to process
    sample_logs = [
        '2023-01-01T10:00:00Z INFO Application started successfully',
        '2023-01-01T10:05:23Z ERROR java.lang.NullPointerException at com.example.Service.doSomething(Service.java:42)',
        '2023-01-01T10:10:15Z WARN Connection timeout to database after 30000ms',
        '2023-01-01T10:15:30Z INFO Request processed in 120ms',
        '{"timestamp": "2023-01-01T10:20:00Z", "level": "ERROR", "message": "Database connection failed", "service": "api-gateway"}'
    ]
    
    # Process logs
    alerts = analyzer.process_logs(sample_logs, "example-service")
    
    print(f"Generated {len(alerts)} alerts")
    print("\nLog Statistics:")
    stats = analyzer.get_log_stats()
    print(f"Total logs processed: {stats['total_logs']}")
    print(f"Logs by level: {stats['logs_by_level']}")

if __name__ == "__main__":
    example_usage()