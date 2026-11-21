import { Briefcase, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Button } from '../components/ui'

export function Welcome() {
  const { setRole } = useApp()
  const navigate = useNavigate()

  function choose(role: 'worker' | 'customer') {
    setRole(role)
    navigate(role === 'worker' ? '/worker/home' : '/customer/explore')
  }

  return (
    <div className="welcome">
      <div className="welcome-bg" />
      <div className="welcome-card">
        <p className="eyebrow">Uganda · Demo</p>
        <h1 className="welcome-brand">FUNDI</h1>
        <p className="welcome-tag">Find skilled people. Run your work smarter.</p>
        <h2>Welcome to FUNDI. What would you like to do?</h2>
        <div className="welcome-actions">
          <button className="welcome-choice" onClick={() => choose('worker')}>
            <Briefcase size={28} />
            <div>
              <strong>I'm a service provider</strong>
              <span>Find customers and manage my work</span>
            </div>
          </button>
          <button className="welcome-choice" onClick={() => choose('customer')}>
            <Search size={28} />
            <div>
              <strong>I need a service</strong>
              <span>Find a skilled person for a job</span>
            </div>
          </button>
        </div>
        <p className="muted center">
          Sample workers and jobs are fictional. You can switch roles anytime from Profile.
        </p>
        <div className="center">
          <Button variant="ghost" size="sm" onClick={() => choose('customer')}>
            Skip to marketplace
          </Button>
        </div>
      </div>
    </div>
  )
}
