import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center p-4">
      <div>
        <p className="text-6xl mb-4">👗</p>
        <h1 className="text-2xl font-bold mb-2">Page introuvable</h1>
        <Link to="/" className="text-primary hover:underline">Retour au dressing</Link>
      </div>
    </div>
  );
}
