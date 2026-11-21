import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { CATEGORIES } from '../../data/seed'
import { Avatar, Button, Card, Chip, Empty, Input, PageHeader, Select } from '../../components/ui'

export function Explore() {
  const { state } = useApp()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [area, setArea] = useState('')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [hasPhotos, setHasPhotos] = useState(false)
  const [sort, setSort] = useState<'recommended' | 'recent' | 'portfolio'>('recommended')

  const areas = useMemo(
    () => Array.from(new Set(state.workers.flatMap((w) => w.serviceAreas))).sort(),
    [state.workers],
  )

  const workers = useMemo(() => {
    let list = state.workers.filter((w) => w.publicProfileEnabled)
    if (q.trim()) {
      const s = q.toLowerCase()
      list = list.filter(
        (w) =>
          w.trade?.toLowerCase().includes(s) ||
          w.businessName?.toLowerCase().includes(s) ||
          w.fullName.toLowerCase().includes(s) ||
          w.services.some((x) => x.toLowerCase().includes(s)) ||
          w.bio.toLowerCase().includes(s),
      )
    }
    if (category) {
      const c = category.replace(/s$/, '').toLowerCase()
      list = list.filter(
        (w) =>
          w.trade?.toLowerCase().includes(c) ||
          category.toLowerCase().includes((w.trade ?? '').toLowerCase()),
      )
    }
    if (area) list = list.filter((w) => w.serviceAreas.includes(area) || w.district === area)
    if (onlyAvailable) list = list.filter((w) => w.availability === 'Available for new work')
    if (hasPhotos) {
      list = list.filter((w) => state.portfolio.some((p) => p.workerId === w.id && p.imageUrls.length))
    }
    if (sort === 'recent') list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (sort === 'portfolio') {
      list = [...list].sort(
        (a, b) =>
          state.portfolio.filter((p) => p.workerId === b.id).length -
          state.portfolio.filter((p) => p.workerId === a.id).length,
      )
    }
    if (sort === 'recommended') {
      list = [...list].sort((a, b) => {
        const score = (w: typeof a) =>
          (w.availability === 'Available for new work' ? 2 : 0) +
          state.portfolio.filter((p) => p.workerId === w.id).length
        return score(b) - score(a)
      })
    }
    return list
  }, [state.workers, state.portfolio, q, category, area, onlyAvailable, hasPhotos, sort])

  const featured = state.portfolio.filter((p) => p.publicVisibility).slice(0, 6)

  return (
    <div className="stack">
      <PageHeader
        title="Find the right person for your next job."
        subtitle="FUNDI Discover · demo marketplace"
      />

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="What service do you need?"
        aria-label="Search services"
      />

      <div className="category-grid">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={category === c ? 'cat-tile active' : 'cat-tile'}
            onClick={() => setCategory(category === c ? '' : c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="filters">
        <Select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Area">
          <option value="">All areas</option>
          {areas.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="recommended">Recommended</option>
          <option value="recent">Recently added</option>
          <option value="portfolio">Most portfolio projects</option>
        </Select>
      </div>
      <div className="row-wrap">
        <label className="check">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />
          Available for new work
        </label>
        <label className="check">
          <input type="checkbox" checked={hasPhotos} onChange={(e) => setHasPhotos(e.target.checked)} />
          Has portfolio photos
        </label>
        <Button size="sm" variant="secondary" onClick={() => navigate('/customer/compare')}>
          Compare saved
        </Button>
      </div>

      <h2>Featured project photos</h2>
      <div className="photo-strip">
        {featured.map((p) => (
          <button
            key={p.id}
            className="photo-thumb"
            onClick={() => navigate(`/customer/worker/${p.workerId}`)}
          >
            <img src={p.imageUrls[0]} alt={p.title} />
          </button>
        ))}
      </div>

      <h2>Workers {category ? `· ${category}` : ''} {area ? `· ${area}` : ''}</h2>
      {workers.length === 0 ? (
        <Empty title="No workers match" body="Try another category or area." />
      ) : (
        <div className="stack-sm">
          {workers.map((w) => {
            const ports = state.portfolio.filter((p) => p.workerId === w.id).slice(0, 3)
            return (
              <Card key={w.id}>
                <div className="row gap">
                  <Avatar name={w.businessName || w.fullName} />
                  <div className="grow">
                    <div className="row-between">
                      <strong>{w.businessName || w.fullName}</strong>
                      <Chip tone={w.availability === 'Available for new work' ? 'success' : 'warn'}>
                        {w.availability}
                      </Chip>
                    </div>
                    <p className="muted">
                      {w.trade} · {w.serviceAreas.join(', ')}
                    </p>
                    <p className="clamp-2">{w.bio}</p>
                    {ports.length > 0 ? (
                      <div className="thumb-row">
                        {ports.map((p) => (
                          <img key={p.id} src={p.imageUrls[0]} alt={p.title} />
                        ))}
                      </div>
                    ) : null}
                    <div className="row-wrap" style={{ marginTop: 10 }}>
                      <Button size="sm" onClick={() => navigate(`/customer/worker/${w.id}`)}>
                        View profile
                      </Button>
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => navigate(`/customer/request/${w.id}`)}
                      >
                        Request a quote
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      <p className="muted center">
        Recommended sort uses availability + portfolio count (transparent demo rule). No fake ratings.
      </p>
      <Link className="muted center" to="/customer/voice">
        Need translation? Open Voice Bridge
      </Link>
    </div>
  )
}
