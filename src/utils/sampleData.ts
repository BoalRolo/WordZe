import { WordsService } from "@/services/words";
import { ExamplesService } from "@/services/examples";

export interface SampleWord {
  word: string;
  translation: string;
  type?: 'verb' | 'noun' | 'phrasal verb' | 'adjective' | 'adverb';
  notes?: string;
  examples: Array<{
    sentence: string;
    translation: string;
  }>;
}

export const sampleWords: SampleWord[] = [
  {
    word: "serendipity",
    translation: "serendipidade",
    type: "noun",
    notes: "The occurrence of events by chance in a happy or beneficial way",
    examples: [
      {
        sentence: "Meeting my best friend was pure serendipity.",
        translation: "Conhecer minha melhor amiga foi pura serendipidade."
      },
      {
        sentence: "The discovery was a beautiful serendipity.",
        translation: "A descoberta foi uma bela serendipidade."
      }
    ]
  },
  {
    word: "ubiquitous",
    translation: "onipresente",
    type: "adjective",
    notes: "Present, appearing, or found everywhere",
    examples: [
      {
        sentence: "Smartphones are ubiquitous in modern society.",
        translation: "Smartphones são onipresentes na sociedade moderna."
      },
      {
        sentence: "The ubiquitous presence of social media affects everyone.",
        translation: "A presença onipresente das redes sociais afeta todos."
      }
    ]
  },
  {
    word: "ephemeral",
    translation: "efêmero",
    type: "adjective",
    notes: "Lasting for a very short time",
    examples: [
      {
        sentence: "The beauty of cherry blossoms is ephemeral.",
        translation: "A beleza das flores de cerejeira é efêmera."
      },
      {
        sentence: "Fame can be ephemeral in the entertainment industry.",
        translation: "A fama pode ser efêmera na indústria do entretenimento."
      }
    ]
  },
  {
    word: "mellifluous",
    translation: "melífluo",
    type: "adjective",
    notes: "Sweet or musical; pleasant to hear",
    examples: [
      {
        sentence: "Her mellifluous voice captivated the audience.",
        translation: "Sua voz melíflua cativou a plateia."
      },
      {
        sentence: "The mellifluous sound of the violin filled the room.",
        translation: "O som melífluo do violino encheu a sala."
      }
    ]
  },
  {
    word: "perspicacious",
    translation: "perspicaz",
    type: "adjective",
    notes: "Having a ready insight into and understanding of things",
    examples: [
      {
        sentence: "The perspicacious detective solved the case quickly.",
        translation: "O detetive perspicaz resolveu o caso rapidamente."
      },
      {
        sentence: "Her perspicacious analysis revealed the hidden truth.",
        translation: "Sua análise perspicaz revelou a verdade oculta."
      }
    ]
  },
  {
    word: "luminous",
    translation: "luminoso",
    type: "adjective",
    notes: "Full of or shedding light; bright or shining",
    examples: [
      {
        sentence: "The luminous moon lit up the night sky.",
        translation: "A lua luminosa iluminou o céu noturno."
      },
      {
        sentence: "Her luminous smile brightened everyone's day.",
        translation: "Seu sorriso luminoso alegrou o dia de todos."
      }
    ]
  },
  {
    word: "resilient",
    translation: "resiliente",
    type: "adjective",
    notes: "Able to withstand or recover quickly from difficult conditions",
    examples: [
      {
        sentence: "Children are remarkably resilient to change.",
        translation: "As crianças são notavelmente resilientes à mudança."
      },
      {
        sentence: "The resilient community rebuilt after the disaster.",
        translation: "A comunidade resiliente se reconstruiu após o desastre."
      }
    ]
  },
  {
    word: "eloquent",
    translation: "eloquente",
    type: "adjective",
    notes: "Fluent or persuasive in speaking or writing",
    examples: [
      {
        sentence: "The eloquent speaker moved the audience to tears.",
        translation: "O orador eloquente comoveu a plateia até as lágrimas."
      },
      {
        sentence: "Her eloquent writing style impressed the critics.",
        translation: "Seu estilo de escrita eloquente impressionou os críticos."
      }
    ]
  },
  {
    word: "meticulous",
    translation: "meticuloso",
    type: "adjective",
    notes: "Showing great attention to detail; very careful and precise",
    examples: [
      {
        sentence: "The meticulous artist spent hours on every detail.",
        translation: "O artista meticuloso passou horas em cada detalhe."
      },
      {
        sentence: "Her meticulous planning ensured the event's success.",
        translation: "Seu planejamento meticuloso garantiu o sucesso do evento."
      }
    ]
  },
  {
    word: "vivacious",
    translation: "vivaz",
    type: "adjective",
    notes: "Attractively lively and animated",
    examples: [
      {
        sentence: "The vivacious dancer brought energy to the stage.",
        translation: "A dançarina vivaz trouxe energia ao palco."
      },
      {
        sentence: "Her vivacious personality made her popular at parties.",
        translation: "Sua personalidade vivaz a tornou popular nas festas."
      }
    ]
  },
  {
    word: "ponder",
    translation: "ponderar",
    type: "verb",
    notes: "Think about something carefully",
    examples: [
      {
        sentence: "I need to ponder this decision before making a choice.",
        translation: "Preciso ponderar esta decisão antes de fazer uma escolha."
      },
      {
        sentence: "She sat quietly to ponder the meaning of life.",
        translation: "Ela sentou-se em silêncio para ponderar o sentido da vida."
      }
    ]
  },
  {
    word: "flourish",
    translation: "florescer",
    type: "verb",
    notes: "Grow or develop in a healthy or vigorous way",
    examples: [
      {
        sentence: "The business began to flourish after the new strategy.",
        translation: "O negócio começou a florescer após a nova estratégia."
      },
      {
        sentence: "Plants flourish in this warm climate.",
        translation: "As plantas florescem neste clima quente."
      }
    ]
  },
  {
    word: "dwindle",
    translation: "diminuir",
    type: "verb",
    notes: "Diminish gradually in size, amount, or strength",
    examples: [
      {
        sentence: "The water supply began to dwindle during the drought.",
        translation: "O abastecimento de água começou a diminuir durante a seca."
      },
      {
        sentence: "His enthusiasm dwindled as the project progressed.",
        translation: "Seu entusiasmo diminuiu conforme o projeto progredia."
      }
    ]
  },
  {
    word: "contemplate",
    translation: "contemplar",
    type: "verb",
    notes: "Look thoughtfully for a long time at",
    examples: [
      {
        sentence: "She sat by the window to contemplate the sunset.",
        translation: "Ela sentou-se à janela para contemplar o pôr do sol."
      },
      {
        sentence: "I contemplate the idea of traveling the world.",
        translation: "Contemplo a ideia de viajar pelo mundo."
      }
    ]
  },
  {
    word: "nurture",
    translation: "nutrir",
    type: "verb",
    notes: "Care for and encourage the growth or development of",
    examples: [
      {
        sentence: "Parents nurture their children with love and care.",
        translation: "Os pais nutrem seus filhos com amor e cuidado."
      },
      {
        sentence: "We must nurture young talent in our organization.",
        translation: "Devemos nutrir jovens talentos em nossa organização."
      }
    ]
  }
];

export async function addSampleWords(userId: string): Promise<void> {
  try {
    for (const sampleWord of sampleWords) {
      // Add the word
      const wordId =       await WordsService.addWord(
        userId,
        sampleWord.word,
        sampleWord.translation,
        sampleWord.type,
        sampleWord.notes
      );

      // Add example sentences
      for (const example of sampleWord.examples) {
        await ExamplesService.addExample(
          userId,
          wordId,
          example.sentence,
          example.translation
        );
      }
    }
  } catch (error) {
    console.error("Error adding sample words:", error);
    throw error;
  }
}

export async function clearAllWords(userId: string): Promise<void> {
  try {
    // This would require implementing a clearAllWords method in WordsService
    // For now, we'll just log the intention
  } catch (error) {
    console.error("Error clearing words:", error);
    throw error;
  }
}
