import { Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-lg font-semibold mb-4">Sobre</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Sobre o projeto
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Créditos
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Objetivo
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Navegação</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#generate" className="hover:text-white transition-colors">
                  Gerar Paleta
                </a>
              </li>
              <li>
                <a href="#equivalency" className="hover:text-white transition-colors">
                  Equivalência
                </a>
              </li>
              <li>
                <a href="#presets" className="hover:text-white transition-colors">
                  Biblioteca de Cores
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Redes Sociais</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; 2025 Rafa Colors. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
