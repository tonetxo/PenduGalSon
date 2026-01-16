import React from 'react';
import { usePhysics } from '../hooks/usePhysics';

const Header = ({
    isSimulating,
    setIsSimulating,
    isMuted,
    setIsMuted,
    setGravity,
    setMass1,
    setMass2,
    setTrailLength,
    setMode,
    showControls,
    setShowControls,
    showInstructions,
    setShowInstructions
}) => {
    const { resetSimulation } = usePhysics();

    const handleReset = () => {
        resetSimulation();
        setGravity(9.8);
        setMass1(15);
        setMass2(15);
        setTrailLength(200);
        // Preservamos el modo actual
        setIsSimulating(false);
        setShowInstructions(true);
    };

    return (
        <header className="h-auto sm:h-16 shrink-0 bg-white border-b px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center z-50 shadow-sm py-2 sm:py-0 transition-all">
            <div className="flex items-center justify-center sm:justify-start w-full sm:w-auto gap-3">
                <span className="font-bold text-lg hidden md:block">Péndulo Musical</span>
                <span className="font-pendugal text-3xl sm:text-2xl text-blue-800">PenduGalSon</span>
            </div>

            <div className="flex items-center justify-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                <button
                    onClick={() => setIsSimulating(!isSimulating)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold transition-all ${isSimulating ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    title={isSimulating ? "Parar" : "Reproducir"}
                >
                    {isSimulating ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16" />
                                <rect x="14" y="4" width="4" height="16" />
                            </svg>
                            <span className="hidden sm:inline">Parar</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5,3 19,12 5,21" />
                            </svg>
                            <span className="hidden sm:inline">Reproducir</span>
                        </>
                    )}
                </button>

                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2 rounded-full transition-colors ${isMuted ? 'text-red-500 bg-red-50' : 'text-blue-600 bg-blue-50'}`}
                    title={isMuted ? "Activar Sonido" : "Silenciar"}
                >
                    {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                            <path d="M23 9l-6 6M17 9l6 6" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </svg>
                    )}
                </button>

                <button
                    onClick={handleReset}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors bg-slate-50"
                    title="Resetear"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 4v6h-6"></path>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                </button>

                <button
                    onClick={() => setShowControls(!showControls)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full md:hidden transition-colors bg-slate-50"
                    title="Ajustes"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="7" x2="20" y2="7" />
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <line x1="4" y1="17" x2="20" y2="17" />
                    </svg>
                </button>

                <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors bg-blue-50"
                    title="Ayuda"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </button>
            </div>
        </header>
    );
};

export default Header;
