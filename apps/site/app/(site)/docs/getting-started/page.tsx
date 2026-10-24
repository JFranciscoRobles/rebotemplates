import type { Metadata } from 'next';
import { GettingStartedPage } from '@/components/docs/getting-started/GettingStartedPage';

export const metadata: Metadata = {
  title: 'Getting started',
  description: 'Install, write a template in Word, render it in Node with values computed in code, make a PDF, check before you send, and use the command line.',
  alternates: { canonical: '/docs/getting-started/' },
};

export default function GettingStarted() {
  return <GettingStartedPage />;
}
