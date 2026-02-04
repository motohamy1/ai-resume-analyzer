// app/routes/_index.tsx
import { redirect } from 'react-router';

// Option B: Or render a component directly
export default function Index() {
    return redirect('/upload');
}