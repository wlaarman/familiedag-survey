import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getFeitOfFabel, createTables, FeitOfFabel } from '@/lib/db';
import PptxGenJS from 'pptxgenjs';

export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await createTables();
  const stellingen = await getFeitOfFabel();

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Familiequiz';
  pptx.title = 'Feit of Fabel - Familiedag 2026';

  const BLUE = '2563EB';
  const DARK = '1E293B';
  const GRAY = '64748B';
  const GREEN = '059669';
  const LIGHT_BG = 'F8FAFC';

  // === Title slide ===
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: BLUE };
  titleSlide.addText('Feit of Fabel', {
    x: 0.5, y: 1.5, w: 9, h: 1.5,
    fontSize: 44, fontFace: 'Arial', color: 'FFFFFF', bold: true, align: 'center',
  });
  titleSlide.addText('Is de stelling waar of niet waar?', {
    x: 0.5, y: 3, w: 9, h: 0.8,
    fontSize: 20, fontFace: 'Arial', color: 'FFFFFF', align: 'center',
  });
  titleSlide.addText('Familiedag 2026', {
    x: 0.5, y: 4.2, w: 9, h: 0.6,
    fontSize: 16, fontFace: 'Arial', color: 'BFDBFE', align: 'center',
  });

  // === All question slides ===
  stellingen.forEach((s, idx) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    addSlideContent(slide, s, idx + 1, false);
  });

  // === Answers divider ===
  const dividerSlide = pptx.addSlide();
  dividerSlide.background = { color: BLUE };
  dividerSlide.addText('Antwoorden', {
    x: 0.5, y: 1.5, w: 9, h: 1.5,
    fontSize: 44, fontFace: 'Arial', color: 'FFFFFF', bold: true, align: 'center',
  });
  dividerSlide.addText('Lever je formulier in voordat je verdergaat!', {
    x: 0.5, y: 3, w: 9, h: 0.8,
    fontSize: 20, fontFace: 'Arial', color: 'BFDBFE', align: 'center',
  });

  // === All answer slides ===
  stellingen.forEach((s, idx) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    addSlideContent(slide, s, idx + 1, true);
  });

  // === End slide ===
  const endSlide = pptx.addSlide();
  endSlide.background = { color: BLUE };
  endSlide.addText(`Dat waren alle ${stellingen.length} stellingen!`, {
    x: 0.5, y: 2, w: 9, h: 1.5,
    fontSize: 36, fontFace: 'Arial', color: 'FFFFFF', bold: true, align: 'center',
  });
  endSlide.addText('Tel je punten op.', {
    x: 0.5, y: 3.5, w: 9, h: 0.8,
    fontSize: 18, fontFace: 'Arial', color: 'BFDBFE', align: 'center',
  });

  const buffer = await pptx.write({ outputType: 'arraybuffer' }) as ArrayBuffer;

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': 'attachment; filename="feit-of-fabel-familiedag-2026.pptx"',
    },
  });

  function addSlideContent(slide: PptxGenJS.Slide, s: FeitOfFabel, num: number, showAnswer: boolean) {
    // Header bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 0.7,
      fill: { color: BLUE },
    });
    slide.addText(`STELLING ${num}`, {
      x: 0.5, y: 0.1, w: 9, h: 0.5,
      fontSize: 14, fontFace: 'Arial', color: 'FFFFFF', bold: true,
    });

    // Stelling text
    slide.addText(s.stelling, {
      x: 0.5, y: 1.0, w: 9, h: 1.2,
      fontSize: 24, fontFace: 'Arial', color: DARK, bold: true,
      valign: 'top', wrap: true,
    });

    // Two options: Feit / Fabel side by side
    const optY = 2.6;
    const optW = 3.8;
    const optH = 1.0;

    const options = [
      { label: 'Feit', letter: 'A', isCorrect: s.is_waar },
      { label: 'Fabel', letter: 'B', isCorrect: !s.is_waar },
    ];

    options.forEach((opt, i) => {
      const x = i === 0 ? 0.8 : 5.4;
      const highlighted = showAnswer && opt.isCorrect;

      slide.addShape(pptx.ShapeType.rect, {
        x, y: optY, w: optW, h: optH,
        fill: { color: highlighted ? 'D1FAE5' : LIGHT_BG },
        line: { color: highlighted ? '6EE7B7' : 'E2E8F0', width: 2 },
        rectRadius: 0.08,
      });

      slide.addText(opt.letter, {
        x, y: optY + 0.1, w: optW, h: 0.25,
        fontSize: 12, fontFace: 'Arial', color: highlighted ? GREEN : GRAY, bold: true, align: 'center',
      });

      slide.addText(opt.label, {
        x, y: optY + 0.3, w: optW, h: 0.6,
        fontSize: 22, fontFace: 'Arial', color: highlighted ? GREEN : DARK, bold: highlighted,
        align: 'center', valign: 'middle',
      });
    });

    // Answer / placeholder
    if (showAnswer) {
      const answerText = s.is_waar ? 'Feit' : 'Fabel';

      slide.addShape(pptx.ShapeType.rect, {
        x: 0.8, y: 4.0, w: 8.4, h: 0.7,
        fill: { color: 'D1FAE5' },
        line: { color: '6EE7B7', width: 1.5 },
        rectRadius: 0.08,
      });

      const text = s.toelichting ? `${answerText} — ${s.toelichting}` : answerText;
      slide.addText(text, {
        x: 1.0, y: 4.0, w: 8, h: 0.7,
        fontSize: 16, fontFace: 'Arial', color: GREEN, bold: true,
        valign: 'middle', wrap: true,
      });
    } else {
      slide.addText('Mijn antwoord:    A  /  B', {
        x: 0.8, y: 4.1, w: 8, h: 0.5,
        fontSize: 16, fontFace: 'Arial', color: GRAY,
      });
    }
  }
}
