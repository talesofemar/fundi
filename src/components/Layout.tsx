import {
  Bookmark,
  Briefcase,
  Home,
  Mic,
  Search,
  MessageSquare,
  User,
  ClipboardList,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { AskFundi } from './AskFundi'
import { DemoBanner } from './ui'

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}

export function WorkerLayout() {
  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="brand">FUNDI</div>
        <p className="brand-tag">Worker workspace</p>
        <NavItem to="/worker/home" icon={<Home size={18} />} label="Home" />
        <NavItem to="/worker/jobs" icon={<Search size={18} />} label="Discover jobs" />
        <NavItem to="/worker/work" icon={<Briefcase size={18} />} label="My work" />
        <NavItem to="/worker/voice" icon={<Mic size={18} />} label="Voice" />
        <NavItem to="/worker/profile" icon={<User size={18} />} label="Profile" />
      </aside>
      <div className="main-col">
        <DemoBanner />
        <main className="page">
          <Outlet />
        </main>
        <nav className="bottom-nav">
          <NavItem to="/worker/home" icon={<Home size={20} />} label="Home" />
          <NavItem to="/worker/jobs" icon={<Search size={20} />} label="Jobs" />
          <NavItem to="/worker/work" icon={<Briefcase size={20} />} label="Work" />
          <NavItem to="/worker/voice" icon={<Mic size={20} />} label="Voice" />
          <NavItem to="/worker/profile" icon={<User size={20} />} label="Profile" />
        </nav>
      </div>
      <AskFundi />
    </div>
  )
}

export function CustomerLayout() {
  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="brand">FUNDI</div>
        <p className="brand-tag">Find skilled people</p>
        <NavItem to="/customer/explore" icon={<Search size={18} />} label="Explore" />
        <NavItem to="/customer/saved" icon={<Bookmark size={18} />} label="Saved" />
        <NavItem to="/customer/requests" icon={<ClipboardList size={18} />} label="My requests" />
        <NavItem to="/customer/messages" icon={<MessageSquare size={18} />} label="Messages" />
        <NavItem to="/customer/profile" icon={<User size={18} />} label="Profile" />
      </aside>
      <div className="main-col">
        <DemoBanner />
        <main className="page">
          <Outlet />
        </main>
        <nav className="bottom-nav">
          <NavItem to="/customer/explore" icon={<Search size={20} />} label="Explore" />
          <NavItem to="/customer/saved" icon={<Bookmark size={20} />} label="Saved" />
          <NavItem to="/customer/requests" icon={<ClipboardList size={20} />} label="Requests" />
          <NavItem to="/customer/messages" icon={<MessageSquare size={20} />} label="Messages" />
          <NavItem to="/customer/profile" icon={<User size={20} />} label="Profile" />
        </nav>
      </div>
      <AskFundi />
    </div>
  )
}
