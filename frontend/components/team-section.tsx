import { Linkedin } from "lucide-react"

const teamMembers = [
  {
    name: "Aditya Gangani",
    image: "images/aditya.jpeg",
    branch: "B.E. Electronics and Communication Engineering",
    usn: "1MS23EC007",
    linkedin: "https://www.linkedin.com/in/aditya-gangwani-615271246/",
  },
  {
    name: "Utkarsh Kumar",
    image: "images/utkarsh.jpeg",
    branch: "B.E. Electronics and Communication Engineering",
    usn: "1MS23EC141",
    linkedin: "https://www.linkedin.com/in/utkarsh-kumar-306a242a6/",
  },
  {
    name: "Shivesh Tiwari",
    image: "images/shivesh.jpeg",
    branch: "B.E. Chemical Engineering",
    usn: "1MS23CH050",
    linkedin: "https://www.linkedin.com/in/shivesh-tiwari-88b451242/",
  },
]

export function TeamSection() {
  return (
    <section className="px-4 py-16 md:py-24" id="team">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Meet the <span className="text-[#0ea5e9]">Team</span>
          </h2>
          <p className="text-[#888888] mt-2">The minds behind DevOps Autopilot.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="group relative bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden hover:border-[#0ea5e9] transition-colors"
            >
              <div className="aspect-square relative overflow-hidden bg-[#1a1a1a]">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-70" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white">{member.name}</h3>
                  <p className="text-[#0ea5e9] text-sm">{member.branch}</p>
                  <p className="text-[#666666] text-xs mt-1">USN: {member.usn}</p>
                </div>
              </div>
              
              <div className="p-4 flex justify-center gap-4">
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a] text-[#888888] hover:text-white hover:bg-[#0ea5e9] transition-colors text-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
