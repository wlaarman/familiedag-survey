'use client';

export default function LogoImage({ bedrijf, customLogos }: {
  bedrijf: { naam: string; website: string; logo?: string };
  customLogos: Record<string, string>;
}) {
  const domain = new URL(bedrijf.website).hostname;

  if (customLogos[bedrijf.naam] || bedrijf.logo) {
    return (
      <img
        src={customLogos[bedrijf.naam] || bedrijf.logo}
        alt="Logo"
        className="w-full h-full object-contain p-3"
      />
    );
  }

  return (
    <>
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt="Logo"
        className="w-full h-full object-contain p-3 absolute inset-0 m-auto"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
        alt="Logo"
        className="w-16 h-16 object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </>
  );
}
