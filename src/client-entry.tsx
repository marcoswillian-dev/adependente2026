import { StartClient } from '@tanstack/react-start/client'
import { StrictMode, startTransition } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter } from './router'

const router = createRouter()

startTransition(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <StartClient router={router} />
    </StrictMode>
  )
})