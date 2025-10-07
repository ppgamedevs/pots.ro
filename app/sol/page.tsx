export default function SolPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-ink mb-4">
            SOL - Sistemul Online de Soluționare
          </h1>
          <p className="text-lg text-subink max-w-2xl mx-auto">
            Pentru rezolvarea rapidă și eficientă a disputelor comerciale între consumatori și comercianți
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg border border-line p-6">
            <h2 className="text-xl font-semibold text-ink mb-4">Pentru Consumatori</h2>
            <ul className="space-y-3 text-subink">
              <li>• Rezolvare rapidă a disputelor comerciale</li>
              <li>• Procedură simplă și gratuită</li>
              <li>• Mediere online cu comercianții</li>
              <li>• Suport specializat ANPC</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-line p-6">
            <h2 className="text-xl font-semibold text-ink mb-4">Pentru Comercianți</h2>
            <ul className="space-y-3 text-subink">
              <li>• Rezolvare amiabilă a conflictelor</li>
              <li>• Evitarea proceselor în instanță</li>
              <li>• Păstrarea reputației comerciale</li>
              <li>• Procedură simplificată</li>
            </ul>
          </div>
        </div>

        <div className="bg-primary/5 rounded-lg border border-primary/20 p-8 text-center">
          <h3 className="text-xl font-semibold text-ink mb-4">
            Cum funcționează SOL?
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-subink">
            <div>
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">1</div>
              <p>Consumatorul depune o plângere online</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">2</div>
              <p>Comerciantul este notificat și poate răspunde</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">3</div>
              <p>Medierea se realizează online cu suport ANPC</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <a 
            href="https://sol.anpc.ro" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-micro font-medium"
          >
            Accesează SOL ANPC
          </a>
        </div>
      </div>
    </div>
  );
}
