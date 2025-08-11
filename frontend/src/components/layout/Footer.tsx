import { useStore } from '@/store/useStore'

export default function Footer() {
  const { statistics } = useStore()

  return (
    <footer className="border-t border-terminal-green/30 bg-black/90 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center text-sm">
          <div className="text-terminal-green/40">
            Building the future of Web3
          </div>
        </div>
      </div>
    </footer>
  )
}