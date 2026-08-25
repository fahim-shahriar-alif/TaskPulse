import { useRef, useState } from 'react'
import { Modal } from './Modal'
import { useStore } from '../context/StoreContext'
import { todayKey } from '../lib/dates'

export function DataPanel() {
  const { exportBackup, importBackup, resetAll } = useStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function downloadBackup() {
    const payload = exportBackup()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `taskpulse_backup_${todayKey()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="space-y-2">
        <button
          type="button"
          onClick={downloadBackup}
          className="min-h-11 w-full rounded-2xl bg-slate-950/50 px-3 text-left text-sm text-slate-300 ring-1 ring-white/10"
        >
          Export backup
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="min-h-11 w-full rounded-2xl bg-slate-950/50 px-3 text-left text-sm text-slate-300 ring-1 ring-white/10"
        >
          Restore JSON
        </button>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="min-h-11 w-full rounded-2xl px-3 text-left text-sm text-rose-300 ring-1 ring-rose-400/20"
        >
          Reset all data
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0]
            if (!file) return
            const text = await file.text()
            const payload = JSON.parse(text)
            await importBackup(payload)
            event.target.value = ''
          }}
        />
      </div>
      <Modal open={confirmReset} title="Clear all data?" onClose={() => setConfirmReset(false)}>
        <p className="text-sm text-slate-400">This permanently deletes your TaskPulse data in Firestore.</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmReset(false)}
            className="min-h-11 flex-1 rounded-2xl ring-1 ring-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={async () => {
              await resetAll()
              setConfirmReset(false)
            }}
            className="min-h-11 flex-1 rounded-2xl bg-rose-500 text-white"
          >
            Delete everything
          </button>
        </div>
      </Modal>
    </>
  )
}
