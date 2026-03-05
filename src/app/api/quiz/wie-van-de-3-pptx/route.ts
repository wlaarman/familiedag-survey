import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getAllResponses, getWieVanDe3Manual, createTables } from '@/lib/db';
import { generateWieVanDe3, WieVanDe3Question } from '@/lib/quiz-wie-van-de-3';
import PptxGenJS from 'pptxgenjs';

export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await createTables();
  const [responses, manualQuestions] = await Promise.all([getAllResponses(), getWieVanDe3Manual()]);
  const questions = generateWieVanDe3(responses, manualQuestions);

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Familiequiz';
  pptx.title = 'Wie van de 3? - Familiedag 2026';

  const BLUE = '2563EB';
  const INDIGO = '4F46E5';
  const DARK = '1E293B';
  const GRAY = '64748B';
  const GREEN = '059669';
  const LIGHT_BG = 'F8FAFC';

  // === Title slide ===
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: INDIGO };
  titleSlide.addText('Wie van de 3?', {
    x: 0.5, y: 1.5, w: 9, h: 1.5,
    fontSize: 44, fontFace: 'Arial', color: 'FFFFFF', bold: true, align: 'center',
  });
  titleSlide.addText('Bij elke vraag horen 3 namen. Slechts 1 is het juiste antwoord!', {
    x: 0.5, y: 3, w: 9, h: 0.8,
    fontSize: 20, fontFace: 'Arial', color: 'FFFFFF', align: 'center',
  });
  titleSlide.addText('Familiedag 2026', {
    x: 0.5, y: 4.2, w: 9, h: 0.6,
    fontSize: 16, fontFace: 'Arial', color: 'C7D2FE', align: 'center',
  });

  // === All question slides ===
  for (const q of questions) {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    addSlideContent(slide, q, false);
  }

  // === Answers divider ===
  const dividerSlide = pptx.addSlide();
  dividerSlide.background = { color: INDIGO };
  dividerSlide.addText('Antwoorden', {
    x: 0.5, y: 1.5, w: 9, h: 1.5,
    fontSize: 44, fontFace: 'Arial', color: 'FFFFFF', bold: true, align: 'center',
  });
  dividerSlide.addText('Lever je formulier in voordat je verdergaat!', {
    x: 0.5, y: 3, w: 9, h: 0.8,
    fontSize: 20, fontFace: 'Arial', color: 'C7D2FE', align: 'center',
  });

  // === All answer slides ===
  for (const q of questions) {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    addSlideContent(slide, q, true);
  }

  // === End slide ===
  const endSlide = pptx.addSlide();
  endSlide.background = { color: INDIGO };
  endSlide.addText(`Dat waren alle ${questions.length} vragen!`, {
    x: 0.5, y: 2, w: 9, h: 1.5,
    fontSize: 36, fontFace: 'Arial', color: 'FFFFFF', bold: true, align: 'center',
  });
  endSlide.addText('Tel je punten op.', {
    x: 0.5, y: 3.5, w: 9, h: 0.8,
    fontSize: 18, fontFace: 'Arial', color: 'C7D2FE', align: 'center',
  });

  const buffer = await pptx.write({ outputType: 'arraybuffer' }) as ArrayBuffer;

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': 'attachment; filename="wie-van-de-3-familiedag-2026.pptx"',
    },
  });

  function addSlideContent(slide: PptxGenJS.Slide, q: WieVanDe3Question, showAnswer: boolean) {
    // Header bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 0.7,
      fill: { color: INDIGO },
    });
    slide.addText(`VRAAG ${q.number}`, {
      x: 0.5, y: 0.1, w: 9, h: 0.5,
      fontSize: 14, fontFace: 'Arial', color: 'FFFFFF', bold: true,
    });

    // Question text
    slide.addText(q.question, {
      x: 0.5, y: 0.9, w: 9, h: 1.0,
      fontSize: 22, fontFace: 'Arial', color: DARK, bold: true,
      valign: 'top', wrap: true,
    });

    // 3 name options side by side
    const optY = 2.3;
    const optW = 2.7;
    const optH = 1.2;
    const startX = 0.8;
    const gapX = 0.15;

    q.names.forEach((name, i) => {
      const isCorrect = showAnswer && i === q.answerIndex;
      const x = startX + i * (optW + gapX);

      slide.addShape(pptx.ShapeType.rect, {
        x, y: optY, w: optW, h: optH,
        fill: { color: isCorrect ? 'D1FAE5' : LIGHT_BG },
        line: { color: isCorrect ? '6EE7B7' : 'E2E8F0', width: 2 },
        rectRadius: 0.08,
      });

      const letter = String.fromCharCode(65 + i);
      slide.addText(letter, {
        x, y: optY + 0.1, w: optW, h: 0.3,
        fontSize: 12, fontFace: 'Arial', color: isCorrect ? GREEN : GRAY, bold: true, align: 'center',
      });

      slide.addText(name, {
        x, y: optY + 0.35, w: optW, h: 0.7,
        fontSize: 20, fontFace: 'Arial', color: isCorrect ? GREEN : DARK, bold: isCorrect, align: 'center',
        valign: 'middle', wrap: true,
      });
    });

    // Answer indicator
    if (showAnswer) {
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.8, y: 3.8, w: 8.4, h: 0.7,
        fill: { color: 'D1FAE5' },
        line: { color: '6EE7B7', width: 1.5 },
        rectRadius: 0.08,
      });

      slide.addText(`${String.fromCharCode(65 + q.answerIndex)})  ${q.answerName}`, {
        x: 1.0, y: 3.8, w: 8, h: 0.7,
        fontSize: 16, fontFace: 'Arial', color: GREEN, bold: true,
        valign: 'middle',
      });
    } else {
      slide.addText('Mijn antwoord:    A  /  B  /  C', {
        x: 0.8, y: 3.8, w: 8, h: 0.5,
        fontSize: 16, fontFace: 'Arial', color: GRAY,
      });
    }
  }
}
