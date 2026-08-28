import { useCallback } from 'react';
import { Backdrop } from './components/layout/Backdrop';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileCta } from './components/layout/MobileCta';
import { Hero } from './components/sections/Hero';
import { TrustBar } from './components/sections/TrustBar';
import { Services } from './components/sections/Services';
import { Benefits } from './components/sections/Benefits';
import { Process } from './components/sections/Process';
import { Cases } from './components/sections/Cases';
import { Testimonials } from './components/sections/Testimonials';
import { Pricing } from './components/sections/Pricing';
import { Faq } from './components/sections/Faq';
import { LeadForm } from './components/sections/LeadForm';
import { FinalCta } from './components/sections/FinalCta';
import { AssistantWidget } from './assistant/AssistantWidget';
import { openAssistant, useAssistantStore } from './assistant/useAssistantStore';

export function LandingPage() {
  const assistantOpen = useAssistantStore((state) => state.isOpen);

  const openQuiz = useCallback(() => openAssistant('quiz'), []);
  const openChat = useCallback(() => openAssistant('chat'), []);
  const openMenu = useCallback(() => openAssistant('menu'), []);

  const scrollToForm = useCallback(() => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      <Backdrop />
      <Header onOpenAssistant={openMenu} />

      <main>
        <Hero onOpenQuiz={openQuiz} onScrollToForm={scrollToForm} />
        <TrustBar />
        <Services onOpenQuiz={openQuiz} />
        <Benefits />
        <Process />
        <Cases />
        <Testimonials />
        <Pricing onOpenQuiz={openQuiz} onScrollToForm={scrollToForm} />
        <Faq onOpenChat={openChat} />
        <LeadForm onOpenQuiz={openQuiz} />
        <FinalCta onOpenQuiz={openQuiz} onScrollToForm={scrollToForm} />
      </main>

      <Footer />

      <MobileCta onOpenQuiz={openQuiz} hidden={assistantOpen} />
      <AssistantWidget />
    </>
  );
}
