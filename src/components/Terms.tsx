import { LegalPage } from './Privacy';

export function Terms({ onBack }: { onBack: () => void }) {
  return (
    <LegalPage title="Terms of Service" onBack={onBack}>
      <section>
        <h2>The Protocol</h2>
        <p>By entering the Kinetic Vault, you agree to adhere to the QUEST daily protocol. QUEST is a framework for self-evolution and performance optimization.</p>
        
        <h2>User Responsibility</h2>
        <p>You are responsible for the authenticity of your deeds. The Narrative Synthesis relies on the integrity of your input. Misleading the neural core results in suboptimal growth narratives.</p>
        
        <h2>Intellectual Property</h2>
        <p>The 5 Pillar Architecture, the QUEST brand, and the Kinetic Vault design system are the exclusive property of QUEST. Your personal growth data belongs to you.</p>
        
        <h2>Limitation of Evolution</h2>
        <p>While QUEST provides the architecture for excellence, your actual evolution depends on your consistent execution in the physical world.</p>
      </section>
    </LegalPage>
  );
}
