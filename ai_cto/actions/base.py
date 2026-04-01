from pydantic import BaseModel
from typing import Optional, Any
from abc import ABC, abstractmethod
import importlib
import pkgutil
from pathlib import Path
import sys


class Action(ABC, BaseModel):
    name: str = ""
    description: str = ""
    
    @abstractmethod
    def run(self, **kwargs) -> dict:
        pass
    
    class Config:
        arbitrary_types_allowed = True
        extra = "allow"


class ActionRegistry:
    _actions: dict[str, type[Action]] = {}
    
    @classmethod
    def register(cls, action_class: type[Action]):
        instance = action_class()
        cls._actions[instance.name] = action_class
    
    @classmethod
    def get_actions(cls) -> dict[str, dict]:
        return {
            name: {"description": cls._actions[name]().description}
            for name in cls._actions
        }
    
    @classmethod
    def get(cls, name: str) -> type[Action]:
        if name not in cls._actions:
            raise ValueError(f"Unknown action: {name}")
        return cls._actions[name]
    
    @classmethod
    def load_actions(cls, package: str):
        package_path = Path(__file__).parent
        for _, module_name, _ in pkgutil.iter_modules([str(package_path)]):
            if module_name == "base":
                continue
            importlib.import_module(f"ai_cto.actions.{module_name}")