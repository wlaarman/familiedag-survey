'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from './ProgressBar';
import PhotoUpload from './PhotoUpload';
import { SurveyData, OPLEIDING_OPTIONS } from '@/types/survey';

const STEP_LABELS = [
  'Persoon 1',
  'Partner',
  'Werk & Studie',
  'Jeugd',
  'Huisdieren & Hobby\'s',
  'Favorieten & Weetjes',
  'Dit of dat?',
];

const initialData: SurveyData = {
  naam_1: '',
  geboortedatum_1: '',
  adres: '',
  heeft_partner: false,
};

export default function SurveyWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<SurveyData>(() => {
    // Restore data from sessionStorage on initial load
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('surveyData');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return initialData;
        }
      }
    }
    return initialData;
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Save data to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('surveyData', JSON.stringify(data));
  }, [data]);

  // Restore step from sessionStorage on mount
  useEffect(() => {
    const savedStep = sessionStorage.getItem('surveyStep');
    if (savedStep) {
      const step = parseInt(savedStep, 10);
      if (!isNaN(step) && step >= 0 && step < STEP_LABELS.length) {
        setCurrentStep(step);
      }
    }
    // Set initial history state
    window.history.replaceState({ step: currentStep }, '', window.location.href);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save step to sessionStorage and scroll to top when step changes
  useEffect(() => {
    sessionStorage.setItem('surveyStep', currentStep.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Handle browser back button
  const handlePopState = useCallback((event: PopStateEvent) => {
    if (event.state && typeof event.state.step === 'number') {
      setCurrentStep(event.state.step);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handlePopState]);

  const updateData = (updates: Partial<SurveyData>) => {
    setData((prev) => ({ ...prev, ...updates }));
    const updatedKeys = Object.keys(updates);
    setErrors((prev) => {
      const newErrors = { ...prev };
      updatedKeys.forEach((key) => delete newErrors[key]);
      return newErrors;
    });
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 0:
        if (!data.naam_1.trim()) newErrors.naam_1 = 'Naam is verplicht';
        if (!data.geboortedatum_1) newErrors.geboortedatum_1 = 'Geboortedatum is verplicht';
        if (!data.adres.trim()) newErrors.adres = 'Adres is verplicht';
        break;
      case 1:
        if (data.heeft_partner) {
          if (!data.naam_2?.trim()) newErrors.naam_2 = 'Naam partner is verplicht';
          if (!data.geboortedatum_2) newErrors.geboortedatum_2 = 'Geboortedatum partner is verplicht';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      const newStep = Math.min(currentStep + 1, STEP_LABELS.length - 1);
      window.history.pushState({ step: newStep }, '', window.location.href);
      setCurrentStep(newStep);
    }
  };

  const prevStep = () => {
    // Use browser history to go back (triggers popstate)
    if (currentStep > 0) {
      window.history.back();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Verzenden mislukt');
      }

      // Clear saved data on successful submit
      sessionStorage.removeItem('surveyData');
      sessionStorage.removeItem('surveyStep');

      router.push('/bedankt');
    } catch {
      alert('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderInput = (
    name: keyof SurveyData,
    label: string,
    type: string = 'text',
    required: boolean = false,
    placeholder?: string,
    subscript?: string
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
        {subscript && <span className="block text-xs font-normal text-gray-400 mt-0.5">{subscript}</span>}
      </label>
      <input
        type={type}
        value={(data[name] as string) || ''}
        onChange={(e) => updateData({ [name]: e.target.value })}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 bg-white
          focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none
          ${errors[name] ? 'border-rose-300 bg-rose-50' : 'border-gray-200 hover:border-gray-300'}`}
      />
      {errors[name] && (
        <p className="text-sm text-rose-500 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {errors[name]}
        </p>
      )}
    </div>
  );

  const renderTextarea = (
    name: keyof SurveyData,
    label: string,
    placeholder?: string,
    subscript?: string
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {subscript && <span className="block text-xs font-normal text-gray-400 mt-0.5">{subscript}</span>}
      </label>
      <textarea
        value={(data[name] as string) || ''}
        onChange={(e) => updateData({ [name]: e.target.value })}
        placeholder={placeholder}
        rows={3}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-200 bg-white
          focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none
          hover:border-gray-300 resize-none"
      />
    </div>
  );

  const renderSelect = (
    name: keyof SurveyData,
    label: string,
    options: readonly string[]
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <select
          value={(data[name] as string) || ''}
          onChange={(e) => updateData({ [name]: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-200 bg-white
            focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none
            hover:border-gray-300 appearance-none cursor-pointer"
        >
          <option value="">Selecteer...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );

  const renderOptionCards = (
    name: keyof SurveyData,
    label: string,
    options: string[],
    columns: number = 2
  ) => (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <div className={`grid grid-cols-${columns} gap-3`}>
        {options.map((opt) => {
          const isSelected = data[name] === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => updateData({ [name]: opt })}
              className={`relative px-4 py-4 rounded-xl border-2 transition-all duration-200 text-left
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                  ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                  {opt}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderYesNo = (
    name: string,
    label: string,
    value: boolean | undefined,
    onChange: (val: boolean) => void
  ) => (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <div className="flex gap-3">
        {[{ label: 'Ja', value: true }, { label: 'Nee', value: false }].map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all duration-200 font-medium
                ${isSelected
                  ? opt.value
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md shadow-emerald-100'
                    : 'border-gray-400 bg-gray-50 text-gray-700 shadow-md shadow-gray-100'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:shadow-sm'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                {isSelected && opt.value && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {opt.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderPreferenceCards = (
    name: keyof SurveyData,
    label: string,
    options: [string, string],
    icons?: [string, string]
  ) => {
    const iconMap: Record<string, React.ReactNode> = {
      coffee: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h1a4 4 0 110 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8zm0 0V6a2 2 0 012-2h10a2 2 0 012 2v2" /></svg>,
      tea: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
      potato: <span className="text-2xl">🥔</span>,
      pasta: <span className="text-2xl">🍝</span>,
      meat: <span className="text-2xl">🥩</span>,
      fish: <span className="text-2xl">🐟</span>,
      summer: <span className="text-2xl">☀️</span>,
      winter: <span className="text-2xl">❄️</span>,
      dog: <span className="text-2xl">🐕</span>,
      cat: <span className="text-2xl">🐈</span>,
      pool: <span className="text-2xl">🏊</span>,
      sea: <span className="text-2xl">🌊</span>,
      car: <span className="text-2xl">🚗</span>,
      bike: <span className="text-2xl">🚴</span>,
    };

    return (
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">{label}</label>
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt, idx) => {
            const isSelected = data[name] === opt;
            const iconKey = icons?.[idx];
            return (
              <button
                key={opt}
                type="button"
                onClick={() => updateData({ [name]: opt })}
                className={`relative px-4 py-5 rounded-xl border-2 transition-all duration-200
                  ${isSelected
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-100 scale-[1.02]'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {iconKey && iconMap[iconKey] && (
                    <div className={`${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                      {iconMap[iconKey]}
                    </div>
                  )}
                  <span className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                    {opt}
                  </span>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <span className="text-4xl">👋</span>
              <h2 className="text-2xl font-bold text-gray-800 mt-2">Over jou</h2>
              <p className="text-gray-500 mt-1">Vertel ons wat meer over jezelf</p>
            </div>
            {renderInput('naam_1', 'Naam', 'text', true)}
            {renderInput('geboortedatum_1', 'Geboortedatum', 'date', true)}
            {renderInput('adres', 'Adres', 'text', true)}
            <PhotoUpload
              label="Foto van vroeger"
              value={data.foto_1_url}
              onChange={(url) => updateData({ foto_1_url: url })}
              sendLater={data.foto_1_later}
              onSendLaterChange={(val) => updateData({ foto_1_later: val })}
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <span className="text-4xl">💑</span>
              <h2 className="text-2xl font-bold text-gray-800 mt-2">Partner</h2>
              <p className="text-gray-500 mt-1">Vul je dit ook in voor een partner?</p>
            </div>

            {renderYesNo(
              'heeft_partner',
              'Heb je een partner?',
              data.heeft_partner,
              (val) => updateData({ heeft_partner: val })
            )}

            {data.heeft_partner && (
              <div className="space-y-6 mt-6 p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-100">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <span className="text-xl">❤️</span> Gegevens partner
                </h3>
                {renderInput('naam_2', 'Naam partner', 'text', true)}
                {renderInput('geboortedatum_2', 'Geboortedatum partner', 'date', true)}
                <PhotoUpload
                  label="Foto van vroeger (partner)"
                  value={data.foto_2_url}
                  onChange={(url) => updateData({ foto_2_url: url })}
                  sendLater={data.foto_2_later}
                  onSendLaterChange={(val) => updateData({ foto_2_later: val })}
                />
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <span className="text-4xl">💼</span>
              <h2 className="text-2xl font-bold text-gray-800 mt-2">Werk & Studie</h2>
              <p className="text-gray-500 mt-1">Vertel over je carrière</p>
            </div>

            {data.heeft_partner && (
              <>
                {renderOptionCards('is_getrouwd', 'Zijn jullie getrouwd?', ['Ja', 'Nee', 'N.v.t.'], 3)}

                {data.is_getrouwd === 'Ja' && (
                  <div className="p-5 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
                    <span className="text-xl mr-2">💍</span>
                    {renderInput('trouwdatum', 'Trouwdatum', 'date')}
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 p-5 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</span>
                  Persoon 1
                </h3>
                {renderInput('werk_1', 'Waar werk je?', 'text', false, undefined, 'Of vul in n.v.t.')}
                {renderSelect('opleiding_1', 'Hoogst afgeronde opleiding', OPLEIDING_OPTIONS)}
              </div>
              {data.heeft_partner && (
                <div className="space-y-4 p-5 bg-pink-50 rounded-xl">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">2</span>
                    Persoon 2
                  </h3>
                  {renderInput('werk_2', 'Waar werk je?', 'text', false, undefined, 'Of vul in n.v.t.')}
                  {renderSelect('opleiding_2', 'Hoogst afgeronde opleiding', OPLEIDING_OPTIONS)}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <span className="text-4xl">💒</span>
              <h2 className="text-2xl font-bold text-gray-800 mt-2">Jeugd</h2>
              <p className="text-gray-500 mt-1">Vertel over je kindertijd</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 p-5 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</span>
                  Persoon 1
                </h3>
                {renderInput('basisschool_1', 'Op welke basisschool zat je?')}
                {renderInput('bijnaam_1', 'Bijnaam', 'text', false, undefined, 'Wat is je bijnaam of hoe werd je vroeger genoemd?')}
                {renderTextarea('bijbaantjes_1', 'Bijbaantjes', 'Bijv. krantenwijk, supermarkt, horeca...', 'Noem er maximaal 3')}
              </div>
              {data.heeft_partner && (
                <div className="space-y-4 p-5 bg-pink-50 rounded-xl">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">2</span>
                    Persoon 2
                  </h3>
                  {renderInput('basisschool_2', 'Op welke basisschool zat je?')}
                  {renderInput('bijnaam_2', 'Bijnaam', 'text', false, undefined, 'Wat is je bijnaam of hoe werd je vroeger genoemd?')}
                  {renderTextarea('bijbaantjes_2', 'Bijbaantjes', 'Bijv. krantenwijk, supermarkt, horeca...', 'Noem er maximaal 3')}
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <span className="text-4xl">🐾</span>
              <h2 className="text-2xl font-bold text-gray-800 mt-2">Huisdieren & Hobby&apos;s</h2>
              <p className="text-gray-500 mt-1">Wat doe je in je vrije tijd?</p>
            </div>

            {renderYesNo(
              'heeft_huisdieren',
              'Heb je huisdieren?',
              data.heeft_huisdieren,
              (val) => updateData({ heeft_huisdieren: val })
            )}

            {data.heeft_huisdieren && (
              <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                <span className="text-xl mr-2">🐕</span>
                {renderTextarea('huisdieren_info', 'Welke huisdieren en hoe heten ze?', 'Bijv. kat Minoes, hond Bob...')}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-4 p-5 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</span>
                  Persoon 1
                </h3>
                {renderInput('sport_1', 'Welke sport doe je?')}
                {renderInput('muziek_1', 'Speel je een muziekinstrument?')}
                {renderInput('vrijwilligerswerk_1', 'Doe je vrijwilligerswerk?')}
                {renderInput('auto_1', 'Welke auto rijd je?')}
              </div>
              {data.heeft_partner && (
                <div className="space-y-4 p-5 bg-pink-50 rounded-xl">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">2</span>
                    Persoon 2
                  </h3>
                  {renderInput('sport_2', 'Welke sport doe je?')}
                  {renderInput('muziek_2', 'Speel je een muziekinstrument?')}
                  {renderInput('vrijwilligerswerk_2', 'Doe je vrijwilligerswerk?')}
                  {renderInput('auto_2', 'Welke auto rijd je?')}
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <span className="text-4xl">⭐</span>
              <h2 className="text-2xl font-bold text-gray-800 mt-2">Favorieten & Weetjes</h2>
              <p className="text-gray-500 mt-1">Wat zijn jouw voorkeuren?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 p-5 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</span>
                  Persoon 1
                </h3>
                {renderInput('vakantieland_1', 'Favoriete vakantieland')}
                {renderInput('gerecht_1', 'Favoriete gerecht')}
                {renderInput('drank_1', 'Favoriete drank')}
                {renderInput('schoenmaat_1', 'Schoenmaat')}
                {renderTextarea('angst_1', 'Voor wie/wat ben je bang?', 'Bijv. vuurwerk, spinnen...')}
                {renderInput('prijs_medaille_1', 'Prijs of medaille gewonnen?', 'text', false, undefined, 'Zo ja, waarvoor?')}
              </div>
              {data.heeft_partner && (
                <div className="space-y-4 p-5 bg-pink-50 rounded-xl">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">2</span>
                    Persoon 2
                  </h3>
                  {renderInput('vakantieland_2', 'Favoriete vakantieland')}
                  {renderInput('gerecht_2', 'Favoriete gerecht')}
                  {renderInput('drank_2', 'Favoriete drank')}
                  {renderInput('schoenmaat_2', 'Schoenmaat')}
                  {renderTextarea('angst_2', 'Voor wie/wat ben je bang?', 'Bijv. vuurwerk, spinnen...')}
                  {renderInput('prijs_medaille_2', 'Prijs of medaille gewonnen?', 'text', false, undefined, 'Zo ja, waarvoor?')}
                </div>
              )}
            </div>

            <div className="mt-6 p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
              <span className="text-xl mr-2">📖</span>
              {renderTextarea(
                'anekdote',
                'Familie-anekdote of herinnering van vroeger',
                'Deel een leuke herinnering of anekdote...'
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <span className="text-4xl">🎯</span>
              <h2 className="text-2xl font-bold text-gray-800 mt-2">Dit of dat?</h2>
              <p className="text-gray-500 mt-1">De laatste vragen - maak je keuze!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5 p-5 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</span>
                  Persoon 1
                </h3>
                {renderPreferenceCards('koffie_thee_1', 'Koffie of thee?', ['Koffie', 'Thee'], ['coffee', 'tea'])}
                {renderPreferenceCards('aardappel_pasta_1', 'Aardappels of pasta?', ['Aardappels', 'Pasta'], ['potato', 'pasta'])}
                {renderPreferenceCards('vlees_vis_1', 'Vlees of vis?', ['Vlees', 'Vis'], ['meat', 'fish'])}
                {renderPreferenceCards('zomer_winter_1', 'Zomer of winter?', ['Zomer', 'Winter'], ['summer', 'winter'])}
                {renderPreferenceCards('hond_kat_1', 'Hond of kat?', ['Hond', 'Kat'], ['dog', 'cat'])}
                {renderPreferenceCards('zwembad_zee_1', 'Zwembad of zee?', ['Zwembad', 'Zee'], ['pool', 'sea'])}
                {renderPreferenceCards('auto_fiets_1', 'Auto of fiets?', ['Auto', 'Fiets'], ['car', 'bike'])}
              </div>
              {data.heeft_partner && (
                <div className="space-y-5 p-5 bg-pink-50 rounded-xl">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">2</span>
                    Persoon 2
                  </h3>
                  {renderPreferenceCards('koffie_thee_2', 'Koffie of thee?', ['Koffie', 'Thee'], ['coffee', 'tea'])}
                  {renderPreferenceCards('aardappel_pasta_2', 'Aardappels of pasta?', ['Aardappels', 'Pasta'], ['potato', 'pasta'])}
                  {renderPreferenceCards('vlees_vis_2', 'Vlees of vis?', ['Vlees', 'Vis'], ['meat', 'fish'])}
                  {renderPreferenceCards('zomer_winter_2', 'Zomer of winter?', ['Zomer', 'Winter'], ['summer', 'winter'])}
                  {renderPreferenceCards('hond_kat_2', 'Hond of kat?', ['Hond', 'Kat'], ['dog', 'cat'])}
                  {renderPreferenceCards('zwembad_zee_2', 'Zwembad of zee?', ['Zwembad', 'Zee'], ['pool', 'sea'])}
                  {renderPreferenceCards('auto_fiets_2', 'Auto of fiets?', ['Auto', 'Fiets'], ['car', 'bike'])}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <ProgressBar
        currentStep={currentStep}
        totalSteps={STEP_LABELS.length}
        stepLabels={STEP_LABELS}
      />

      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 sm:p-8 border border-gray-100">
        {renderStep()}

        <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200
              ${currentStep === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Vorige
          </button>

          {currentStep < STEP_LABELS.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium
                hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-200 transition-all duration-200"
            >
              Volgende
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all duration-200
                ${submitting
                  ? 'bg-emerald-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-lg hover:shadow-emerald-200'
                } text-white`}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verzenden...
                </>
              ) : (
                <>
                  Versturen
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
