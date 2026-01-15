import { NextResponse } from 'next/server';
import { insertSurveyResponse, createTables } from '@/lib/db';
import { SurveyData } from '@/types/survey';

export async function POST(request: Request) {
  try {
    // Ensure tables exist
    await createTables();

    const data: SurveyData = await request.json();

    // Basic validation
    if (!data.naam_1 || !data.geboortedatum_1 || !data.adres || !data.schoenmaat_1) {
      return NextResponse.json(
        { error: 'Verplichte velden ontbreken' },
        { status: 400 }
      );
    }

    // Partner validation
    if (data.heeft_partner && (!data.naam_2 || !data.geboortedatum_2)) {
      return NextResponse.json(
        { error: 'Partner gegevens zijn onvolledig' },
        { status: 400 }
      );
    }

    const id = await insertSurveyResponse(data);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error submitting survey:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}
