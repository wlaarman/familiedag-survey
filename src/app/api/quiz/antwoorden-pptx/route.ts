import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getAllResponses, getFeitOfFabel, getStreetviewQuiz, getCustomLogos, getLogoSelection, getWieVanDe3Manual, getKenJeElkaar, createTables } from '@/lib/db';
import { generateQuestions } from '@/lib/quiz-questions';
import { generateWieVanDe3 } from '@/lib/quiz-wie-van-de-3';
import { BEDRIJVEN } from '@/lib/bedrijven';
import PptxGenJS from 'pptxgenjs';

export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await createTables();

  const [responses, stellingen, streetviewItems, customLogos, logoSelection, manualQuestions, kenJeElkaarVragen] = await Promise.all([
    getAllResponses(),
    getFeitOfFabel(),
    getStreetviewQuiz(),
    getCustomLogos(),
    getLogoSelection(),
    getWieVanDe3Manual(),
    getKenJeElkaar(),
  ]);

  const cijferQuestions = generateQuestions(responses);
  const wieVanDe3Questions = generateWieVanDe3(responses, manualQuestions);
  const selectedBedrijven = BEDRIJVEN.filter(b => logoSelection.includes(b.naam));

  // Photos for Wie is Wie
  const photos: { name: string; responseId: number }[] = [];
  for (const r of responses) {
    if (r.foto_1_url) photos.push({ name: r.naam_1, responseId: r.id });
    if (r.foto_2_url && r.naam_2) photos.push({ name: r.naam_2, responseId: r.id });
  }
  photos.sort((a, b) => {
    const hashA = a.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 31 + a.responseId;
    const hashB = b.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 31 + b.responseId;
    return hashA - hashB;
  });

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Familiequiz';
  pptx.title = 'Familiequiz Antwoorden - Familiedag 2026';

  const BLUE = '2563EB';
  const DARK = '1E293B';
  const GRAY = '64748B';
  const GREEN = '059669';
  const INDIGO = '4F46E5';
  const LIGHT_BG = 'F8FAFC';

  // ============================================================
  // TITLE SLIDE
  // ============================================================
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: BLUE };
  titleSlide.addText('Familiequiz', {
    x: 0.5, y: 1.2, w: 9, h: 1.5,
    fontSize: 48, fontFace: 'Arial', color: 'FFFFFF', bold: true, align: 'center',
  });
  titleSlide.addText('Antwoorden', {
    x: 0.5, y: 2.7, w: 9, h: 0.8,
    fontSize: 24, fontFace: 'Arial', color: 'BFDBFE', align: 'center',
  });
  titleSlide.addText('Familiedag 2026', {
    x: 0.5, y: 4.2, w: 9, h: 0.6,
    fontSize: 16, fontFace: 'Arial', color: 'BFDBFE', align: 'center',
  });

  // ============================================================
  // RONDE 1: CIJFERRONDE
  // ============================================================
  addRondeDivider('Ronde 1', 'Cijferronde', BLUE);

  for (const q of cijferQuestions) {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };

    // Header
    addHeader(slide, `RONDE 1  •  VRAAG ${q.number}`, BLUE);

    // Question
    const qLines = q.question.split('\n').length;
    const qHeight = Math.max(0.8, Math.min(1.8, qLines * 0.35));
    slide.addText(q.question, {
      x: 0.5, y: 0.9, w: 9, h: qHeight,
      fontSize: 22, fontFace: 'Arial', color: DARK, bold: true, valign: 'top', wrap: true,
    });

    let nextY = 0.9 + qHeight + 0.2;

    // Options with correct highlighted
    if (q.type === 'multiple_choice' && q.options) {
      const gap = Math.min(0.6, (5.63 - nextY - 1.2) / q.options.length);
      const optH = gap - 0.08;

      q.options.forEach((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        const isCorrect = q.answer.toLowerCase().startsWith(opt.toLowerCase());
        const bgColor = isCorrect ? 'D1FAE5' : LIGHT_BG;
        const borderColor = isCorrect ? '6EE7B7' : 'E2E8F0';
        const textColor = isCorrect ? GREEN : DARK;

        slide.addShape(pptx.ShapeType.rect, {
          x: 0.8, y: nextY + i * gap, w: 8.4, h: optH,
          fill: { color: bgColor }, line: { color: borderColor, width: 1.5 }, rectRadius: 0.08,
        });
        slide.addText(`${letter})  ${opt}`, {
          x: 1.0, y: nextY + i * gap, w: 8, h: optH,
          fontSize: 18, fontFace: 'Arial', color: textColor, bold: isCorrect, valign: 'middle',
        });
      });
      nextY += q.options.length * gap + 0.3;
    }

    // Answer box
    const mainAnswer = q.answer.split('\n')[0];
    addAnswerBox(slide, mainAnswer, nextY);
  }

  // ============================================================
  // RONDE 2: WIE IS WIE?
  // ============================================================
  addRondeDivider('Ronde 2', 'Wie is Wie?', BLUE);
  addNumberedList(photos.map((p, i) => ({ num: i + 1, text: p.name })), 'RONDE 2  •  WIE IS WIE?', BLUE);

  // ============================================================
  // RONDE 3: FEIT OF FABEL
  // ============================================================
  addRondeDivider('Ronde 3', 'Feit of Fabel', BLUE);

  stellingen.forEach((s, idx) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };

    addHeader(slide, `RONDE 3  •  STELLING ${idx + 1}`, BLUE);

    slide.addText(s.stelling, {
      x: 0.5, y: 1.0, w: 9, h: 1.2,
      fontSize: 24, fontFace: 'Arial', color: DARK, bold: true, valign: 'top', wrap: true,
    });

    // Feit / Fabel options
    const optY = 2.6;
    const optW = 3.8;
    const optH = 1.0;
    [
      { label: 'Feit', isCorrect: s.is_waar },
      { label: 'Fabel', isCorrect: !s.is_waar },
    ].forEach((opt, i) => {
      const x = i === 0 ? 0.8 : 5.4;
      const highlighted = opt.isCorrect;
      slide.addShape(pptx.ShapeType.rect, {
        x, y: optY, w: optW, h: optH,
        fill: { color: highlighted ? 'D1FAE5' : LIGHT_BG },
        line: { color: highlighted ? '6EE7B7' : 'E2E8F0', width: 2 }, rectRadius: 0.08,
      });
      slide.addText(opt.label, {
        x, y: optY, w: optW, h: optH,
        fontSize: 22, fontFace: 'Arial', color: highlighted ? GREEN : DARK, bold: highlighted,
        align: 'center', valign: 'middle',
      });
    });

    // Toelichting
    const answerText = s.is_waar ? 'Feit' : 'Fabel';
    const text = s.toelichting ? `${answerText} — ${s.toelichting}` : answerText;
    addAnswerBox(slide, text, 4.0);
  });

  // ============================================================
  // RONDE 4: RAAD DE STRAAT
  // ============================================================
  addRondeDivider('Ronde 4', 'Raad de Straat!', BLUE);
  addNumberedList(
    streetviewItems.map(item => ({ num: item.question_number, text: `${item.names} — ${item.address}` })),
    'RONDE 4  •  RAAD DE STRAAT', BLUE,
  );

  // ============================================================
  // RONDE 5: HOE GOED KEN JE ELKAAR?
  // ============================================================
  addRondeDivider('Ronde 5', 'Hoe goed ken je elkaar?', BLUE);

  kenJeElkaarVragen.forEach((v, idx) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };

    addHeader(slide, `RONDE 5  •  VRAAG ${idx + 1}`, BLUE);

    slide.addText(v.question, {
      x: 0.5, y: 1.0, w: 9, h: 1.2,
      fontSize: 24, fontFace: 'Arial', color: DARK, bold: true, valign: 'top', wrap: true,
    });

    if (v.threshold !== null) {
      const realAnswer = parseInt(v.answer);
      const isMeer = !isNaN(realAnswer) && realAnswer > v.threshold;

      slide.addText(`Meer of minder dan ${v.threshold}?`, {
        x: 0.5, y: 2.2, w: 9, h: 0.6,
        fontSize: 20, fontFace: 'Arial', color: BLUE, bold: true, align: 'center',
      });

      const optY = 3.0;
      const optW = 3.8;
      const optH = 1.0;
      [
        { label: 'Meer', isCorrect: isMeer },
        { label: 'Minder', isCorrect: !isMeer },
      ].forEach((opt, i) => {
        const x = i === 0 ? 0.8 : 5.4;
        const highlighted = opt.isCorrect;
        slide.addShape(pptx.ShapeType.rect, {
          x, y: optY, w: optW, h: optH,
          fill: { color: highlighted ? 'D1FAE5' : LIGHT_BG },
          line: { color: highlighted ? '6EE7B7' : 'E2E8F0', width: 2 }, rectRadius: 0.08,
        });
        slide.addText(opt.label, {
          x, y: optY, w: optW, h: optH,
          fontSize: 22, fontFace: 'Arial', color: highlighted ? GREEN : DARK, bold: highlighted,
          align: 'center', valign: 'middle',
        });
      });

      const text = v.toelichting ? `${v.answer} — ${v.toelichting}` : v.answer;
      addAnswerBox(slide, text, optY + optH + 0.3);
    } else {
      const text = v.toelichting ? `${v.answer} — ${v.toelichting}` : v.answer;
      addAnswerBox(slide, text, 2.6);
    }
  });

  // ============================================================
  // RONDE 6: LOGO QUIZ
  // ============================================================
  addRondeDivider('Ronde 6', 'Logo Quiz', BLUE);
  addNumberedList(
    selectedBedrijven.map((b, i) => ({ num: i + 1, text: b.naam })),
    'RONDE 6  •  LOGO QUIZ', BLUE,
  );

  // ============================================================
  // RONDE 7: WIE VAN DE 3?
  // ============================================================
  addRondeDivider('Ronde 7', 'Wie van de 3?', INDIGO);

  for (const q of wieVanDe3Questions) {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };

    addHeader(slide, `RONDE 7  •  VRAAG ${q.number}`, INDIGO);

    slide.addText(q.question, {
      x: 0.5, y: 0.9, w: 9, h: 1.0,
      fontSize: 22, fontFace: 'Arial', color: DARK, bold: true, valign: 'top', wrap: true,
    });

    // 3 name options
    const optY = 2.3;
    const optW = 2.7;
    const optH = 1.2;
    q.names.forEach((name, i) => {
      const isCorrect = i === q.answerIndex;
      const x = 0.8 + i * (optW + 0.15);

      slide.addShape(pptx.ShapeType.rect, {
        x, y: optY, w: optW, h: optH,
        fill: { color: isCorrect ? 'D1FAE5' : LIGHT_BG },
        line: { color: isCorrect ? '6EE7B7' : 'E2E8F0', width: 2 }, rectRadius: 0.08,
      });

      const letter = String.fromCharCode(65 + i);
      slide.addText(letter, {
        x, y: optY + 0.1, w: optW, h: 0.3,
        fontSize: 12, fontFace: 'Arial', color: isCorrect ? GREEN : GRAY, bold: true, align: 'center',
      });
      slide.addText(name, {
        x, y: optY + 0.35, w: optW, h: 0.7,
        fontSize: 20, fontFace: 'Arial', color: isCorrect ? GREEN : DARK, bold: isCorrect,
        align: 'center', valign: 'middle', wrap: true,
      });
    });

    addAnswerBox(slide, `${String.fromCharCode(65 + q.answerIndex)})  ${q.answerName}`, 3.8);
  }

  // ============================================================
  // END SLIDE
  // ============================================================
  const endSlide = pptx.addSlide();
  endSlide.background = { color: BLUE };
  endSlide.addText('Dat waren alle antwoorden!', {
    x: 0.5, y: 1.5, w: 9, h: 1.5,
    fontSize: 36, fontFace: 'Arial', color: 'FFFFFF', bold: true, align: 'center',
  });

  const totalQuestions = cijferQuestions.length + photos.length + stellingen.length
    + streetviewItems.length + kenJeElkaarVragen.length + selectedBedrijven.length + wieVanDe3Questions.length;
  endSlide.addText(`${totalQuestions} vragen over 7 rondes`, {
    x: 0.5, y: 3, w: 9, h: 0.8,
    fontSize: 20, fontFace: 'Arial', color: 'BFDBFE', align: 'center',
  });
  endSlide.addText('Tel je punten op!', {
    x: 0.5, y: 3.8, w: 9, h: 0.6,
    fontSize: 18, fontFace: 'Arial', color: 'BFDBFE', align: 'center',
  });

  const buffer = await pptx.write({ outputType: 'arraybuffer' }) as ArrayBuffer;

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': 'attachment; filename="familiequiz-antwoorden-2026.pptx"',
    },
  });

  // === Helper functions ===

  function addHeader(slide: PptxGenJS.Slide, text: string, color: string) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 0.7,
      fill: { color },
    });
    slide.addText(text, {
      x: 0.5, y: 0.1, w: 9, h: 0.5,
      fontSize: 14, fontFace: 'Arial', color: 'FFFFFF', bold: true,
    });
  }

  function addAnswerBox(slide: PptxGenJS.Slide, text: string, y: number) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.8, y, w: 8.4, h: 0.7,
      fill: { color: 'D1FAE5' },
      line: { color: '6EE7B7', width: 1.5 }, rectRadius: 0.08,
    });
    slide.addText(text, {
      x: 1.0, y, w: 8, h: 0.7,
      fontSize: 16, fontFace: 'Arial', color: GREEN, bold: true,
      valign: 'middle', wrap: true,
    });
  }

  function addRondeDivider(rondeLabel: string, titel: string, color: string) {
    const slide = pptx.addSlide();
    slide.background = { color };
    slide.addText(rondeLabel, {
      x: 0.5, y: 1.5, w: 9, h: 0.8,
      fontSize: 20, fontFace: 'Arial', color: 'BFDBFE', align: 'center',
    });
    slide.addText(titel, {
      x: 0.5, y: 2.2, w: 9, h: 1.5,
      fontSize: 44, fontFace: 'Arial', color: 'FFFFFF', bold: true, align: 'center',
    });
    slide.addText('Antwoorden', {
      x: 0.5, y: 3.8, w: 9, h: 0.6,
      fontSize: 16, fontFace: 'Arial', color: 'BFDBFE', align: 'center',
    });
  }

  function addNumberedList(items: { num: number; text: string }[], headerText: string, color: string) {
    const perSlide = 15;
    for (let page = 0; page < items.length; page += perSlide) {
      const pageItems = items.slice(page, page + perSlide);
      const slide = pptx.addSlide();
      slide.background = { color: 'FFFFFF' };

      addHeader(slide, headerText, color);

      // Two columns
      const colItems = [
        pageItems.slice(0, Math.ceil(pageItems.length / 2)),
        pageItems.slice(Math.ceil(pageItems.length / 2)),
      ];

      colItems.forEach((col, colIdx) => {
        const x = colIdx === 0 ? 0.5 : 5.0;
        col.forEach((item, i) => {
          const y = 0.9 + i * 0.3;
          slide.addText(`${item.num}.`, {
            x, y, w: 0.5, h: 0.28,
            fontSize: 11, fontFace: 'Arial', color: BLUE, bold: true, align: 'right',
          });
          slide.addText(item.text, {
            x: x + 0.55, y, w: 4, h: 0.28,
            fontSize: 11, fontFace: 'Arial', color: DARK,
          });
        });
      });
    }
  }
}
