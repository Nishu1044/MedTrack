import {
  GiBrain,
  GiHeartOrgan,
  GiLungs,
  GiKidneys,
  GiLiver,
  GiStomach,
  GiBoneKnife,
  GiMuscleUp,
  GiShield,
  GiSwallow,
} from 'react-icons/gi';
import { FaCapsules } from 'react-icons/fa';

const CATEGORIES = [
  {
    test: /paracet|ibuprof|aspirin|crocin|dolo|combif|nurofen|nimesul|diclofenac|naproxen|tramadol/i,
    category: 'Pain & Fever',
    description: 'Reduces pain and lowers fever by blocking pain signals in the brain.',
    icon: GiBrain,
    target: 'Brain & nerves',
    gradient: 'linear(135deg, #ef4444, #fb923c)',
    color: '#ef4444',
  },
  {
    test: /amlodi|losart|ramipril|telmis|metoprol|atenolol|enalapril|nifedipine|valsart|olmes/i,
    category: 'Blood Pressure',
    description: 'Relaxes blood vessels so your heart pumps more easily.',
    icon: GiHeartOrgan,
    target: 'Heart & blood vessels',
    gradient: 'linear(135deg, #ec4899, #f472b6)',
    color: '#ec4899',
  },
  {
    test: /metform|glimep|insulin|sitaglipt|gliclaz|empag|dapagli/i,
    category: 'Diabetes',
    description: 'Helps your body use sugar effectively and controls blood glucose.',
    icon: GiLiver,
    target: 'Liver & pancreas',
    gradient: 'linear(135deg, #f59e0b, #fde68a)',
    color: '#f59e0b',
  },
  {
    test: /amoxicill|azithromy|cipro|levo|metroniz|cefix|doxycyc|cefurox|augment/i,
    category: 'Antibiotic',
    description: 'Fights bacterial infection by destroying harmful bacteria.',
    icon: GiShield,
    target: 'Whole body / infection site',
    gradient: 'linear(135deg, #10b981, #6ee7b7)',
    color: '#10b981',
  },
  {
    test: /vitamin|calcium|iron|folic|d3|b12|zinc|biotin|omega|magnesium|multivit/i,
    category: 'Supplement',
    description: 'Provides essential nutrients your body needs for daily function.',
    icon: GiMuscleUp,
    target: 'Bones, muscles & immune',
    gradient: 'linear(135deg, #8b5cf6, #22d3ee)',
    color: '#8b5cf6',
  },
  {
    test: /salbu|levosal|monteluk|budesonid|formoter|fluticas|theophyl|asthalin|seroflo/i,
    category: 'Respiratory',
    description: 'Opens airways to make breathing easier.',
    icon: GiLungs,
    target: 'Lungs & airways',
    gradient: 'linear(135deg, #06b6d4, #67e8f9)',
    color: '#06b6d4',
  },
  {
    test: /pantopr|omepra|rabep|esomep|ranit|famot|domper|ondans|metoclo/i,
    category: 'Digestive',
    description: 'Reduces stomach acid and protects your gut lining.',
    icon: GiStomach,
    target: 'Stomach & intestines',
    gradient: 'linear(135deg, #84cc16, #bef264)',
    color: '#84cc16',
  },
  {
    test: /furose|spirono|hydrochloro|torsemide|amiloride/i,
    category: 'Kidney / Diuretic',
    description: 'Helps your kidneys remove excess water and salt.',
    icon: GiKidneys,
    target: 'Kidneys',
    gradient: 'linear(135deg, #3b82f6, #93c5fd)',
    color: '#3b82f6',
  },
  {
    test: /alpraz|cloraz|diaze|sertraline|fluoxet|escitalop|venlafax|amitripty/i,
    category: 'Mental Health',
    description: 'Balances brain chemistry to ease anxiety, depression or sleep issues.',
    icon: GiBrain,
    target: 'Brain & mood',
    gradient: 'linear(135deg, #a855f7, #c084fc)',
    color: '#a855f7',
  },
  {
    test: /cetiriz|loratad|fexofen|monteluk|chlorphen|levocet/i,
    category: 'Allergy',
    description: 'Blocks histamine to stop sneezing, itching and runny nose.',
    icon: GiSwallow,
    target: 'Immune response',
    gradient: 'linear(135deg, #ec4899, #fda4af)',
    color: '#ec4899',
  },
  {
    test: /calci|alendr|risedron|denosum/i,
    category: 'Bone Health',
    description: 'Strengthens bones and prevents loss of bone density.',
    icon: GiBoneKnife,
    target: 'Bones',
    gradient: 'linear(135deg, #14b8a6, #5eead4)',
    color: '#14b8a6',
  },
];

const DEFAULT_CATEGORY = {
  category: 'General',
  description: 'Take as prescribed by your doctor.',
  icon: FaCapsules,
  target: 'As advised',
  gradient: 'linear(135deg, brand.500, accent.cyan)',
  color: '#8b5cf6',
};

export function categorizeMedication(name = '') {
  for (const cat of CATEGORIES) {
    if (cat.test.test(name)) {
      return cat;
    }
  }
  return DEFAULT_CATEGORY;
}
