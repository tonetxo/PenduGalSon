// Números con coma decimal, como se escriben en galego
export const fmt = (n, decimais = 2) => n.toFixed(decimais).replace('.', ',');

// Tres cifras significativas, para valores que poden ir de 0,01 a centos
export const fmtCifras = (n) => fmt(n, Math.abs(n) >= 100 ? 0 : Math.abs(n) >= 10 ? 1 : Math.abs(n) >= 1 ? 2 : 3);
