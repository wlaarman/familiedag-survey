import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getKenJeElkaar, createTables, KenJeElkaar } from '@/lib/db';
import PptxGenJS from 'pptxgenjs';

export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await createTables();
  const vragen = await getKenJeElkaar();

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Familiequiz';
  pptx.title = 'Hoe goed ken je elkaar? - Familiedag 2026';

  const BLUE = '2563EB';
  const DARK = '1E293B';
  const GRAY = '64748B';
  const GREEN = '059669';
  const LIGHT_BG = 'F8FAFC';

  // === Title slide ===
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: BLUE };
  titleSlide.addText('Hoe goed ken je elkaar?', {
    x: 0.5, y: 1.5, w: 9, h: 1.5,
    fontSize: 40, fontFace: 'Arial', color: 'FFFFFF', bold: true, align: 'center',
  });
  titleSlide.addText('Meer of minder? Of weet je het exacte antwoord?', {
    x: 0.5, y: 3, w: 9, h: 0.8,
    fontSize: 20, fontFace: 'Arial', color: 'BFDBFE', align: 'center',
  });
  titleSlide.addText('Familiedag 2026', {
    x: 0.5, y: 4.2, w: 9, h: 0.6,
    fontSize: 16, fontFace: 'Arial', color: 'BFDBFE', align: 'center',
  });

  // === All question slides ===
  vragen.forEach((v, idx) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    addSlideContent(slide, v, idx + 1, false);
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
  vragen.forEach((v, idx) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    addSlideContent(slide, v, idx + 1, true);
  });

  // === End slide ===
  const endSlide = pptx.addSlide();
  endSlide.background = { color: BLUE };
  endSlide.addText(`Dat waren alle ${vragen.length} vragen!`, {
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
      'Content-Disposition': 'attachment; filename="ken-je-elkaar-familiedag-2026.pptx"',
    },
  });

  function addSlideContent(slide: PptxGenJS.Slide, v: KenJeElkaar, num: number, showAnswer: boolean) {
    const SLIDE_H = 5.63;

    // Header bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 0.7,
      fill: { color: BLUE },
    });
    slide.addText(`VRAAG ${num}`, {
      x: 0.5, y: 0.1, w: 9, h: 0.5,
      fontSize: 14, fontFace: 'Arial', color: 'FFFFFF', bold: true,
    });

    // Question text
    slide.addText(v.question, {
      x: 0.5, y: 1.0, w: 9, h: 1.2,
      fontSize: 24, fontFace: 'Arial', color: DARK, bold: true,
      valign: 'top', wrap: true,
    });

    if (v.threshold !== null) {
      // Meer/minder question with threshold
      const realAnswer = parseInt(v.answer);
      const isMeer = !isNaN(realAnswer) && realAnswer > v.threshold;

      // Show threshold prominently
      slide.addText(`Meer of minder dan ${v.threshold}?`, {
        x: 0.5, y: 2.2, w: 9, h: 0.6,
        fontSize: 20, fontFace: 'Arial', color: BLUE, bold: true, align: 'center',
      });

      // Two options: Meer / Minder
      const optY = 3.0;
      const optW = 3.8;
      const optH = 1.0;
      const options = [
        { label: 'Meer', letter: 'A', isCorrect: isMeer },
        { label: 'Minder', letter: 'B', isCorrect: !isMeer },
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

      // Answer box
      if (showAnswer) {
        const answerY = optY + optH + 0.3;
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.8, y: answerY, w: 8.4, h: 0.7,
          fill: { color: 'D1FAE5' },
          line: { color: '6EE7B7', width: 1.5 },
          rectRadius: 0.08,
        });
        const text = v.toelichting ? `${v.answer} — ${v.toelichting}` : v.answer;
        slide.addText(text, {
          x: 1.0, y: answerY, w: 8, h: 0.7,
          fontSize: 16, fontFace: 'Arial', color: GREEN, bold: true,
          valign: 'middle', wrap: true,
        });
      }
    } else {
      // Open/number question without threshold
      if (showAnswer) {
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.8, y: 2.6, w: 8.4, h: 0.7,
          fill: { color: 'D1FAE5' },
          line: { color: '6EE7B7', width: 1.5 },
          rectRadius: 0.08,
        });
        const text = v.toelichting ? `${v.answer} — ${v.toelichting}` : v.answer;
        slide.addText(text, {
          x: 1.0, y: 2.6, w: 8, h: 0.7,
          fontSize: 16, fontFace: 'Arial', color: GREEN, bold: true,
          valign: 'middle', wrap: true,
        });
      } else {
        slide.addText('Antwoord: ___________', {
          x: 0.8, y: 2.8, w: 8, h: 0.5,
          fontSize: 16, fontFace: 'Arial', color: GRAY,
        });
      }
    }
  }
}
