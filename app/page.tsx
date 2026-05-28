import { NothingburgerEngine } from '@/components/prism-engine'

export default function PrismPage() {
  return (
    <main className="bg-black min-h-screen overflow-hidden">
      <NothingburgerEngine
        showStats={true}
        showEquations={true}
        showControls={true}
        defaultPanelOpen={true}
        nodeCount={1000}
      />
    </main>
  )
}
