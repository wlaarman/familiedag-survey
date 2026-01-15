import SurveyWizard from '@/components/survey/SurveyWizard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Familiequiz</h1>
        <p className="text-gray-600 mt-2">
          Help ons met het verzamelen van leuke feitjes voor de familiequiz!
        </p>
      </div>
      <SurveyWizard />
    </main>
  );
}
