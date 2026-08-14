import { NothingburgerEngine } from '@/components/prism-engine'

export default function PrismPage() {
  return (
    <main className="bg-black min-h-screen overflow-hidden">
      <NothingburgerEngine
        showStats={true}
        showEquations={false}
        showControls={true}
        defaultPanelOpen={false}
        showHero={true}
        initialPreset="the-field"
        nodeCount={1600}
      />
    </main>
  )
}
