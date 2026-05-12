// Redirect /dashboard/events → /dashboard (events are shown on the main dashboard)
import { redirect } from 'next/navigation'
export default function EventsPage() { redirect('/dashboard') }
