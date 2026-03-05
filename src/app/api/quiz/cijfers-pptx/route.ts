import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getAllResponses } from '@/lib/db';
import { generateQuestions, QuizQuestion } from '@/lib/quiz-questions';
import PptxGenJS from 'pptxgenjs';

export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const responses = await getAllResponses();
  const questions = generateQuestions(responses);

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Familiequiz';
  pptx.title = 'Cijferronde - Familiedag 2026';

  const BLUE = '2563EB';
  const DARK = '1E293B';
  const GRAY = '64748B';
  const GREEN = '059669';
  const LIGHT_BG = 'F8FAFC';

  // === Title slide ===
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: BLUE };
  titleSlide.addText('Cijferronde', {
    x: 0.5, y: 1.5, w: 9, h: 1.5,
    fontSize: 44, fontFace: 'Arial', color: 'FFFFFF', bold: true, align: 'center',
  });
  titleSlide.addText('Hoe goed ken je de familie?', {
    x: 0.5, y: 3, w: 9, h: 0.8,
    fontSize: 20, fontFace: 'Arial', color: 'FFFFFF', align: 'center',
  });
  titleSlide.addText('Familiedag 2026', {
    x: 0.5, y: 4.2, w: 9, h: 0.6,
    fontSize: 16, fontFace: 'Arial', color: 'BFDBFE', align: 'center',
  });

  // === Example question slide ===
  const exSlide = pptx.addSlide();
  exSlide.background = { color: 'FFFFFF' };
  addQuestionContent(exSlide, {
    number: 0,
    category: 'Voorbeeld',
    question: 'Hoeveel rondes heeft de familiequiz?',
    type: 'multiple_choice',
    options: ['5', '6', '7', '8'],
    answer: '7 rondes',
  }, false);

  // === Example answer slide ===
  const exAnsSlide = pptx.addSlide();
  exAnsSlide.background = { color: 'FFFFFF' };
  addQuestionContent(exAnsSlide, {
    number: 0,
    category: 'Voorbeeld',
    question: 'Hoeveel rondes heeft de familiequiz?',
    type: 'multiple_choice',
    options: ['5', '6', '7', '8'],
    answer: '7 rondes',
  }, true);

  // === All question slides first ===
  for (const q of questions) {
    const qSlide = pptx.addSlide();
    qSlide.background = { color: 'FFFFFF' };
    addQuestionContent(qSlide, q, false);
  }

  // === Answers divider slide ===
  const dividerSlide = pptx.addSlide();
  dividerSlide.background = { color: BLUE };
  dividerSlide.addText('Antwoorden', {
    x: 0.5, y: 1.5, w: 9, h: 1.5,
    fontSize: 44, fontFace: 'Arial', color: 'FFFFFF', bold: true, align: 'center',
  });
  dividerSlide.addText(`Lever je formulier in voordat je verdergaat!`, {
    x: 0.5, y: 3, w: 9, h: 0.8,
    fontSize: 20, fontFace: 'Arial', color: 'BFDBFE', align: 'center',
  });

  // === All answer slides ===
  for (const q of questions) {
    const aSlide = pptx.addSlide();
    aSlide.background = { color: 'FFFFFF' };
    addQuestionContent(aSlide, q, true);
  }

  // === End slide ===
  const endSlide = pptx.addSlide();
  endSlide.background = { color: BLUE };
  endSlide.addText(`Dat waren alle ${questions.length} vragen!`, {
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
      'Content-Disposition': 'attachment; filename="cijferronde-familiedag-2026.pptx"',
    },
  });

  function addQuestionContent(slide: PptxGenJS.Slide, q: QuizQuestion, showAnswer: boolean) {
    const SLIDE_H = 5.63; // 16:9 slide height in inches
    const MARGIN = 0.3;   // bottom margin

    // Header bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 0.7,
      fill: { color: BLUE },
    });
    const label = q.number === 0 ? 'VOORBEELD' : `VRAAG ${q.number}`;
    slide.addText(`${label}  •  ${q.category.toUpperCase()}`, {
      x: 0.5, y: 0.1, w: 9, h: 0.5,
      fontSize: 14, fontFace: 'Arial', color: 'FFFFFF', bold: true,
    });

    // Estimate question height based on line count
    const qLines = q.question.split('\n').length;
    const qHeight = Math.max(0.8, Math.min(1.8, qLines * 0.35));

    // Question text
    slide.addText(q.question, {
      x: 0.5, y: 0.9, w: 9, h: qHeight,
      fontSize: 22, fontFace: 'Arial', color: DARK, bold: true,
      valign: 'top', wrap: true,
    });

    let nextY = 0.9 + qHeight + 0.2;

    // Options (for multiple choice)
    if (q.type === 'multiple_choice' && q.options) {
      const optCount = q.options.length;
      // Calculate option size to fit: remaining space minus answer area
      const availableForOpts = showAnswer
        ? SLIDE_H - nextY - MARGIN - 0.9  // leave room for answer box
        : SLIDE_H - nextY - MARGIN;
      const gap = Math.min(0.6, availableForOpts / optCount);
      const optH = gap - 0.08;

      q.options.forEach((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        const isCorrect = showAnswer && q.answer.toLowerCase().startsWith(opt.toLowerCase());

        const bgColor = isCorrect ? 'D1FAE5' : LIGHT_BG;
        const borderColor = isCorrect ? '6EE7B7' : 'E2E8F0';
        const textColor = isCorrect ? GREEN : DARK;

        slide.addShape(pptx.ShapeType.rect, {
          x: 0.8, y: nextY + i * gap, w: 8.4, h: optH,
          fill: { color: bgColor },
          line: { color: borderColor, width: 1.5 },
          rectRadius: 0.08,
        });

        slide.addText(`${letter})  ${opt}`, {
          x: 1.0, y: nextY + i * gap, w: 8, h: optH,
          fontSize: 18, fontFace: 'Arial', color: textColor, bold: isCorrect,
          valign: 'middle',
        });
      });
      nextY += optCount * gap + 0.15;
    }

    // Answer box
    if (showAnswer) {
      const answerH = Math.max(0.6, SLIDE_H - nextY - MARGIN);
      const fullAnswer = q.answer.replace(/\n\n+/g, '\n');

      slide.addShape(pptx.ShapeType.rect, {
        x: 0.8, y: nextY, w: 8.4, h: answerH,
        fill: { color: 'D1FAE5' },
        line: { color: '6EE7B7', width: 1.5 },
        rectRadius: 0.08,
      });

      slide.addText(fullAnswer, {
        x: 1.0, y: nextY + 0.05, w: 8, h: answerH - 0.1,
        fontSize: 14, fontFace: 'Arial', color: GREEN, bold: true,
        valign: 'middle', wrap: true,
      });
    } else if (q.type !== 'multiple_choice') {
      slide.addText('Antwoord: _______________', {
        x: 0.8, y: nextY, w: 8, h: 0.5,
        fontSize: 18, fontFace: 'Arial', color: GRAY,
      });
    }
  }
}
