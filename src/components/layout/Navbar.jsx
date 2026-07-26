import { NavbarProfile } from './NavbarProfile'

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-end gap-4 border-b border-[#334155] bg-[#0F172A]/90 px-4 backdrop-blur md:h-16">
      <NavbarProfile roleLabel="Client" badgeColor="text-[#25D366]" badgeBg="bg-[#25D366]/15" showAiAgent={true} />
    </header>
  )
}
