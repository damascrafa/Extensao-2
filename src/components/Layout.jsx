import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import Navbar from './Navbar'
import Footer from './Footer'

// A animação reinicia quando muda a seção da URL, não a cada troca de aula.
function transitionKey(pathname) {
  return pathname.startsWith('/aprender/') ? pathname.split('/').slice(0, 3).join('/') : pathname
}

export default function Layout() {
  const { pathname } = useLocation()
  return (
    <>
      <a href="#conteudo" className="no-print sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-sun focus:px-4 focus:py-2 focus:font-bold">
        Pular para o conteúdo
      </a>
      <Navbar />
      <main id="conteudo" className="min-h-[70vh]">
        <motion.div
          key={transitionKey(pathname)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer />
    </>
  )
}
