import { LegalPage } from './Privacy';

export function ScientificMethod({ onBack }: { onBack: () => void }) {
  return (
    <LegalPage title="Scientific Method" onBack={onBack}>
      <section>
        <h2>The 5 Pillar Architecture</h2>
        <p>Our methodology is rooted in holistic human performance studies. By segmenting life into 5 core pillars (Soul, Health, Mind, Skill, Heart), we apply a modular approach to self-optimization.</p>
        
        <h2>Narrative Synthesis</h2>
        <p>We utilize Large Language Models (LLMs) to perform qualitative analysis on quantitative behavioral data. This creates a "reflective loop" shown to improve cognitive processing of personal achievements.</p>
        
        <h2>Habit Formation Logic</h2>
        <p>QUEST leverages neurological research on cue-routine-reward systems. Each "Deed" serves as a micro-win that strengthens the neural pathways associated with discipline and self-efficacy.</p>
        
        <h2>Quantitative Telemetry</h2>
        <p>By tracking duration, pillars, and feelings, we provide a high-fidelity data set that allows users to identify correlations between their spiritual soulset practices and their biological healthset performance.</p>
      </section>
    </LegalPage>
  );
}
