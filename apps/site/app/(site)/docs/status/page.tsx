import type { Metadata } from 'next';
import { StatusPage } from '@/components/docs/status/StatusPage';

export const metadata: Metadata = {
  title: 'Status and roadmap',
  description: 'What is checked, with the tests, the timings and the size as they were measured; what is not; the known limits; what is asked of Rebodocs; the roadmap.',
  alternates: { canonical: '/docs/status/' },
};

export default function Status() {
  return <StatusPage />;
}
