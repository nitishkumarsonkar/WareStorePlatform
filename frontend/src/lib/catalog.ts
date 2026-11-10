export interface CategoryDefinition {
  category: string;
  icon: string;
  units: string[];
  subItems: string[];
  brands: string[];
}

export const CONSTRUCTION_CATALOG: CategoryDefinition[] = [
  {
    category: 'Sand',
    icon: 'Waves',
    units: ['Cubic Feet (CFT)', 'Tons', 'Brass'],
    subItems: [
      'M-Sand (Plastering Grade)',
      'M-Sand (Concrete / Block Grade)',
      'P-Sand (Plastering)',
      'River Sand (Washed & Screened)',
      'Pit Sand',
    ],
    brands: ['Certified River Wash', 'Ultra Plaster Sand', 'Star M-Sand', 'Local Quarry Certified'],
  },
  {
    category: 'Bricks',
    icon: 'Boxes',
    units: ['Pieces', 'Thousands', 'Pallets'],
    subItems: [
      'AAC Blocks (600x200x150mm)',
      'AAC Blocks (600x200x200mm)',
      'AAC Blocks (600x200x100mm)',
      'Red Clay Wirecut Bricks',
      'Fly Ash Bricks (Class C/F)',
      'Solid Concrete Blocks (400x200x200mm)',
      'Hollow Concrete Blocks',
    ],
    brands: ['Magicrete', 'Siporex', 'Birla Aerocon', 'JK Lakshmi', 'Standard Kiln Burnt'],
  },
  {
    category: 'Cement',
    icon: 'Layers',
    units: ['Bags (50 kg)', 'Metric Tons'],
    subItems: [
      'OPC 53 Grade',
      'OPC 43 Grade',
      'PPC (Portland Pozzolana Cement)',
      'PSC (Portland Slag Cement)',
      'White Portland Cement',
      'Waterproof Cement',
    ],
    brands: ['UltraTech Cement', 'ACC Cement', 'Ambuja Cement', 'Dalmia Bharat', 'JSW Cement', 'Shree Cement'],
  },
  {
    category: 'Steel',
    icon: 'Shield',
    units: ['Tons', 'Quintals', 'Bundles', 'Meters'],
    subItems: [
      'TMT Fe 550D (8mm to 32mm)',
      'TMT Fe 500 (10mm, 12mm, 16mm)',
      'MS Binding Wire (18 Gauge)',
      'Structural Steel (I-Beams / Angles)',
      'MS Channels & Flat Bars',
      'Stirrups / Ring Links',
    ],
    brands: ['Tata Tiscon', 'JSW NeoSteel', 'SAIL TMT', 'Jindal Panther', 'Kamdhenu Steel', 'Shyam Steel'],
  },
  {
    category: 'Aggregates',
    icon: 'Mountain',
    units: ['Tons', 'Cubic Feet (CFT)', 'Brass'],
    subItems: [
      '20mm Blue Metal Aggregate',
      '40mm Coarse Aggregate',
      '10mm Aggregate (Granite Chips)',
      'Wet Mix Macadam (WMM / GSB)',
      'Quarry Dust / Crusher Powder',
      'Boulder Stone',
    ],
    brands: ['Blue Metal Certified', 'Granite Aggregates Ltd', 'Apex Aggregates', 'Quarry Direct'],
  },
  {
    category: 'Electrical',
    icon: 'Zap',
    units: ['Meters', 'Coils (90m)', 'Pieces', 'Boxes'],
    subItems: [
      'FR PVC Insulated Copper Wires (1.5 / 2.5 / 4.0 sq mm)',
      'Heavy Duty Rigid PVC Conduits (20mm / 25mm)',
      'MCB Miniature Circuit Breakers (16A / 32A)',
      'Modular Switch Plates & Gang Boxes',
      'Armoured Power Cables (4 Core)',
    ],
    brands: ['Polycab', 'Havells', 'Finolex', 'Schneider Electric', 'Anchor by Panasonic'],
  },
  {
    category: 'Plumbing',
    icon: 'Pipette',
    units: ['Meters', 'Lengths (3m/6m)', 'Pieces'],
    subItems: [
      'CPVC Hot & Cold Water Pipes (SDR 11)',
      'UPVC Pressure Pipes (Schedule 40/80)',
      'SWR Drainage Pipes & Fittings (Ring Fit)',
      'Brass Concealed Valves & Bib Taps',
      'Water Storage Overhead Tanks (1000L / 2000L)',
    ],
    brands: ['Astral Pipes', 'Ashirvad Pipes', 'Supreme Industries', 'Finolex Plumber', 'Sintex Tanks'],
  },
];
