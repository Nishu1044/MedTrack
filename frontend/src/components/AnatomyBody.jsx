import { Box, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionG = motion.g;
const MotionCircle = motion.circle;
const MotionEllipse = motion.ellipse;
const MotionPath = motion.path;

/**
 * SVG anatomical body diagram.
 * - Shows full upper body with transparent skin and all internal organs.
 * - Category determines which organ(s) glow + pulse (the "target area").
 * - Pill capsule animates from top (mouth) down to the target organ.
 *
 * Categorization is keyword-based (utils/medicationInsights), so any new
 * medicine the user adds is auto-detected — no DB / manual mapping needed.
 */

// Which organs to highlight per category. Multiple IDs = multiple highlights.
const TARGET_ORGANS = {
  'Pain & Fever':      ['brain'],
  'Mental Health':     ['brain'],
  'Blood Pressure':    ['heart', 'arteryMain'],
  Respiratory:         ['lungL', 'lungR'],
  Antibiotic:          ['arteryMain', 'heart'], // bloodstream
  Allergy:             ['lungL', 'lungR', 'arteryMain'],
  Supplement:          ['heart', 'lungL', 'lungR', 'liver', 'brain'], // whole body
  Diabetes:            ['liver', 'pancreas'],
  Digestive:           ['stomach', 'intestine'],
  'Kidney / Diuretic': ['kidneyL', 'kidneyR'],
  'Bone Health':       ['ribs'],
  General:             ['heart'],
};

// Organ centers (in 300x460 viewBox) — used to position the pill landing
const ORGAN_CENTERS = {
  brain:      { x: 150, y: 50 },
  heart:      { x: 138, y: 158 },
  lungL:      { x: 110, y: 148 },
  lungR:      { x: 190, y: 148 },
  liver:      { x: 178, y: 195 },
  pancreas:   { x: 145, y: 210 },
  stomach:    { x: 122, y: 200 },
  intestine:  { x: 150, y: 255 },
  kidneyL:    { x: 118, y: 230 },
  kidneyR:    { x: 182, y: 230 },
  arteryMain: { x: 150, y: 160 },
  ribs:       { x: 150, y: 170 },
};

const AnatomyBody = ({ info, height = 360 }) => {
  const targets = TARGET_ORGANS[info.category] || ['heart'];
  const color = info.color || '#8b5cf6';
  const isTarget = (id) => targets.includes(id);

  // Pick the first target's position for pill landing
  const primaryTarget = ORGAN_CENTERS[targets[0]] || ORGAN_CENTERS.heart;

  // Helpers: opacity + glow for target vs non-target organs
  const opOf = (id) => (isTarget(id) ? 0.95 : 0.25);
  const glowOf = (id) => (isTarget(id) ? `drop-shadow(0 0 8px ${color})` : 'none');

  return (
    <Box
      position="relative"
      h={`${height}px`}
      w="full"
      borderRadius="xl"
      overflow="hidden"
      bg="radial-gradient(circle at 50% 40%, rgba(255,255,255,0.06), rgba(0,0,0,0.5))"
      border="1px solid rgba(255,255,255,0.08)"
    >
      <svg
        viewBox="0 0 300 460"
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        <defs>
          {/* Soft glow filter for highlighted organs */}
          <filter id="organGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Radial gradient for skin (translucent) */}
          <radialGradient id="skinGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
          </radialGradient>

          {/* Organ gradients */}
          <radialGradient id="brainGrad">
            <stop offset="0%" stopColor="#fbcfe8" stopOpacity="1" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.7" />
          </radialGradient>
          <radialGradient id="heartGrad">
            <stop offset="0%" stopColor="#fca5a5" stopOpacity="1" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.85" />
          </radialGradient>
          <radialGradient id="lungGrad">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="1" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.7" />
          </radialGradient>
          <radialGradient id="liverGrad">
            <stop offset="0%" stopColor="#fed7aa" stopOpacity="1" />
            <stop offset="100%" stopColor="#c2410c" stopOpacity="0.85" />
          </radialGradient>
          <radialGradient id="stomachGrad">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="1" />
            <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.85" />
          </radialGradient>
          <radialGradient id="kidneyGrad">
            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="1" />
            <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.85" />
          </radialGradient>
          <radialGradient id="intestineGrad">
            <stop offset="0%" stopColor="#fda4af" stopOpacity="1" />
            <stop offset="100%" stopColor="#be185d" stopOpacity="0.85" />
          </radialGradient>
          <radialGradient id="pancreasGrad">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
            <stop offset="100%" stopColor="#a16207" stopOpacity="0.85" />
          </radialGradient>
        </defs>

        {/* ====================== SKIN / OUTLINE ====================== */}
        <g stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="url(#skinGrad)">
          {/* Head */}
          <circle cx="150" cy="50" r="35" />
          {/* Neck */}
          <path d="M135 82 L135 96 Q150 102 165 96 L165 82 Z" />
          {/* Torso */}
          <path d="
            M90 100
            Q70 100 70 120
            L70 280
            Q70 300 80 305
            L130 305
            L130 380
            Q130 395 135 410
            L130 450
            L170 450
            L170 410
            Q170 395 170 380
            L170 305
            L220 305
            Q230 300 230 280
            L230 120
            Q230 100 210 100
            Z
          " />
          {/* Arms (shoulders out) */}
          <path d="M70 110 Q50 115 45 145 L42 220 Q42 235 50 248" />
          <path d="M230 110 Q250 115 255 145 L258 220 Q258 235 250 248" />
        </g>

        {/* ====================== SKELETON HINT (ribs) ====================== */}
        <MotionG
          stroke={isTarget('ribs') ? color : 'rgba(255,255,255,0.15)'}
          strokeWidth={isTarget('ribs') ? 1.5 : 0.6}
          fill="none"
          opacity={isTarget('ribs') ? 0.9 : 0.3}
          filter={isTarget('ribs') ? 'url(#organGlow)' : 'none'}
          animate={isTarget('ribs') ? { opacity: [0.6, 1, 0.6] } : {}}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {[125, 140, 155, 170, 185, 200].map((y, i) => (
            <path
              key={i}
              d={`M${100 + i * 1.5} ${y} Q150 ${y - 6} ${200 - i * 1.5} ${y}`}
            />
          ))}
        </MotionG>

        {/* ====================== MAIN ARTERY ====================== */}
        <MotionPath
          d="M150 100 Q150 130 145 165 Q140 200 145 235 Q150 270 150 300"
          stroke={isTarget('arteryMain') ? color : '#ef4444'}
          strokeWidth={isTarget('arteryMain') ? 2.5 : 1.2}
          fill="none"
          opacity={isTarget('arteryMain') ? 0.9 : 0.35}
          filter={isTarget('arteryMain') ? 'url(#organGlow)' : 'none'}
          animate={isTarget('arteryMain') ? { strokeDashoffset: [0, -16] } : {}}
          strokeDasharray={isTarget('arteryMain') ? '4 4' : ''}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />

        {/* ====================== BRAIN ====================== */}
        <MotionG
          opacity={opOf('brain')}
          filter={glowOf('brain')}
          animate={isTarget('brain') ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '150px 50px', transformBox: 'fill-box' }}
        >
          <circle cx="150" cy="50" r="24" fill="url(#brainGrad)" />
          {/* Brain folds */}
          <path d="M135 42 Q145 38 155 42 M135 50 Q145 46 155 50 M138 58 Q150 54 162 58"
            stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none" />
        </MotionG>

        {/* ====================== LUNGS ====================== */}
        <MotionEllipse
          cx="110" cy="148" rx="22" ry="32"
          fill="url(#lungGrad)"
          opacity={opOf('lungL')}
          filter={glowOf('lungL')}
          animate={isTarget('lungL') ? { ry: [32, 35, 32] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <MotionEllipse
          cx="190" cy="148" rx="22" ry="32"
          fill="url(#lungGrad)"
          opacity={opOf('lungR')}
          filter={glowOf('lungR')}
          animate={isTarget('lungR') ? { ry: [32, 35, 32] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ====================== HEART ====================== */}
        <MotionG
          opacity={opOf('heart')}
          filter={glowOf('heart')}
          animate={isTarget('heart') ? { scale: [1, 1.15, 1, 1.08, 1] } : {}}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '138px 158px', transformBox: 'fill-box' }}
        >
          <path
            d="M138 175 C 120 165, 115 145, 138 145 C 161 145, 156 165, 138 175 Z"
            fill="url(#heartGrad)"
            transform="translate(0,-3)"
          />
        </MotionG>

        {/* ====================== STOMACH ====================== */}
        <MotionPath
          d="M105 185 Q105 175 120 175 L140 175 Q150 175 150 195 Q150 220 130 220 Q110 220 105 205 Z"
          fill="url(#stomachGrad)"
          opacity={opOf('stomach')}
          filter={glowOf('stomach')}
          animate={isTarget('stomach') ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ====================== LIVER ====================== */}
        <MotionPath
          d="M155 180 Q155 170 175 170 L210 175 Q215 195 210 210 Q190 215 170 210 Q160 200 155 195 Z"
          fill="url(#liverGrad)"
          opacity={opOf('liver')}
          filter={glowOf('liver')}
          animate={isTarget('liver') ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ====================== PANCREAS ====================== */}
        <MotionEllipse
          cx="148" cy="215" rx="20" ry="6"
          fill="url(#pancreasGrad)"
          opacity={opOf('pancreas')}
          filter={glowOf('pancreas')}
          animate={isTarget('pancreas') ? { rx: [20, 22, 20] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ====================== KIDNEYS ====================== */}
        <MotionPath
          d="M105 225 Q100 225 100 235 Q100 250 110 252 Q120 252 122 240 Q122 228 115 224 Z"
          fill="url(#kidneyGrad)"
          opacity={opOf('kidneyL')}
          filter={glowOf('kidneyL')}
          animate={isTarget('kidneyL') ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <MotionPath
          d="M195 225 Q200 225 200 235 Q200 250 190 252 Q180 252 178 240 Q178 228 185 224 Z"
          fill="url(#kidneyGrad)"
          opacity={opOf('kidneyR')}
          filter={glowOf('kidneyR')}
          animate={isTarget('kidneyR') ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ====================== INTESTINE ====================== */}
        <MotionPath
          d="M108 255
             Q108 245 120 245
             L180 245
             Q192 245 192 257
             Q192 268 178 268
             L122 268
             Q108 268 108 280
             Q108 290 122 290
             L182 290"
          fill="none"
          stroke={isTarget('intestine') ? color : '#fda4af'}
          strokeWidth={isTarget('intestine') ? 10 : 6}
          strokeLinecap="round"
          opacity={isTarget('intestine') ? 0.9 : 0.5}
          filter={isTarget('intestine') ? 'url(#organGlow)' : 'none'}
          animate={isTarget('intestine') ? { strokeWidth: [10, 12, 10] } : {}}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ====================== PILL JOURNEY ====================== */}
        {/* Halo ring at target */}
        <MotionCircle
          cx={primaryTarget.x}
          cy={primaryTarget.y}
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="2"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: [1, 2.2, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          style={{ transformOrigin: `${primaryTarget.x}px ${primaryTarget.y}px`, transformBox: 'fill-box' }}
        />

        {/* Pill capsule traveling down to target */}
        <MotionG
          initial={{ x: 150, y: 0, opacity: 0 }}
          animate={{
            x: [150, 150, primaryTarget.x],
            y: [0, 50, primaryTarget.y],
            opacity: [0, 1, 1, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3.5,
            times: [0, 0.15, 0.85, 1],
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <ellipse cx="0" cy="0" rx="6" ry="11" fill={color} filter="url(#organGlow)" />
          <ellipse cx="0" cy="-2" rx="6" ry="3" fill="white" opacity="0.4" />
        </MotionG>

        {/* Trailing particles */}
        {[0, 1, 2].map((i) => (
          <MotionCircle
            key={i}
            cx="0" cy="0" r="2.5"
            fill={color}
            initial={{ x: 150, y: 0, opacity: 0 }}
            animate={{
              x: [150, 150, primaryTarget.x],
              y: [0, 50, primaryTarget.y],
              opacity: [0, 0.8, 0.8, 0],
            }}
            transition={{
              duration: 3.5,
              times: [0, 0.15, 0.85, 1],
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.2 + i * 0.15,
            }}
          />
        ))}
      </svg>

      {/* Target organ badge top-right */}
      <Box
        position="absolute"
        top={2}
        right={3}
        px={2}
        py={1}
        borderRadius="md"
        bg="rgba(0,0,0,0.55)"
        backdropFilter="blur(8px)"
        border={`1px solid ${color}66`}
      >
        <Text
          fontSize="2xs"
          fontFamily="'Rajdhani', sans-serif"
          letterSpacing="0.1em"
          fontWeight="700"
          color={color}
          textTransform="uppercase"
        >
          → {info.target}
        </Text>
      </Box>

      {/* Hint */}
      <Text
        position="absolute"
        bottom={2}
        left={3}
        fontSize="2xs"
        color="rgba(255,255,255,0.45)"
        fontFamily="'Rajdhani', sans-serif"
        letterSpacing="0.08em"
      >
        AUTO-DETECTED FROM MEDICINE NAME
      </Text>
    </Box>
  );
};

export default AnatomyBody;
