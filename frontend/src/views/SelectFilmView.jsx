import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Film, Loader } from 'lucide-react'
import { useAuthStore } from '../authStore'
import SeoHead from '../components/SeoHead'

export default function SelectFilmView() {
  const { userFilms, selectFilm, fetchFilms, loading } = useAuthStore()
  const navigate = useNavigate()
  const [selecting, setSelecting] = useState(null)

  useEffect(() => {
    if (userFilms.length === 0) fetchFilms()
  }, [])

  const handleSelect = async (film) => {
    setSelecting(film.id)
    await selectFilm(film)
    navigate('/app/dashboard')
  }

  return (
    <>
      <SeoHead title="Select Film" url="/app/select-film" />
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-amber-500 text-slate-950 p-3 rounded-xl mb-3">
              <Film className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold">Select a Film</h1>
            <p className="text-slate-400 text-sm mt-1">Choose the film you want to work on</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader className="h-6 w-6 animate-spin text-amber-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {userFilms.map((film) => (
                <button
                  key={film.id}
                  onClick={() => handleSelect(film)}
                  disabled={selecting === film.id}
                  className="w-full flex items-center gap-4 bg-slate-900/50 border border-slate-800/50 hover:border-amber-500/30 rounded-xl p-4 transition-all text-left disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Film className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-200 truncate">{film.title}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {film.role_name || film.user_role || 'Member'}
                    </p>
                  </div>
                  {selecting === film.id && (
                    <Loader className="h-4 w-4 animate-spin text-amber-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
