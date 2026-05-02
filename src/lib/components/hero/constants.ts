import type { VisualEventKind } from './types';

export const GLYPHS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ{}[]<>/\\\\+=:;._-#$%';
export const SCIENCE_GLYPHS = ['·', '∙', '•', '/', '\\', '-', '|', '@', '#', '$', '%', '&', '*', '+', '=', '?', '!', '~'];
export const BLOCK_GLYPHS = ['█', '▓', '▒', '░'];
// Desktop draws every requestAnimationFrame; the browser/display refresh rate is the cap.
export const FRAME_MS = 0;
export const MOBILE_FRAME_MS = 1000 / 30;
export const MOBILE_BREAKPOINT = 640;
export const TABLET_BREAKPOINT = 1024;
export const CELL_X = 6;
export const CELL_Y = 8;
export const SPATIAL_GRID_CELL = 64;

export const CURSOR_LEVELS = 10;
export const CURSOR_RADIUS_X = 42;
export const CURSOR_RADIUS_Y = 32;
export const CURSOR_REBOUND_RADIUS_X = 70;
export const CURSOR_REBOUND_RADIUS_Y = 54;
export const CURSOR_REBOUND_MOVE_THRESHOLD = 18;

export const HOVER_MIN_FONT = 2.8;
export const HOVER_MAX_FONT = 7;
export const HOVER_MIN_ALPHA = 0.22;
export const HOVER_MAX_ALPHA = 0.76;
export const HOVER_MIN_DENSITY = 3;
export const HOVER_MAX_DENSITY = 18;
export const HOVER_CLUSTER_RADIUS_X = 10.5;
export const HOVER_CLUSTER_RADIUS_Y = 9.2;

export const BLOCK_REBOUND_DURATION = 980;
export const BLOCK_REBOUND_OVERSHOOT = 1.55;
export const BLOCK_REBOUND_HIDE_MAX = 0.16;

export const CLICK_BLOCK_DURATION = 980;
export const CLICK_UNBLOCK_DURATION = 760;
export const CLICK_RAREFY_MAX = 0.18;
export const CLICK_TRANSITION_WINDOW = 0.22;
export const CLICK_DENSITY_MIN_FONT = 3.5;
export const CLICK_DENSITY_MAX_FONT = 7;
export const CLICK_DENSITY_MIN_COUNT = 2;
export const CLICK_DENSITY_MAX_COUNT = 11;

export const CLICK_RIPPLE_DURATION = 2600;
export const CLICK_RIPPLE_SPEED = 0.125;
export const CLICK_RIPPLE_WIDTH = 14.5;
export const CLICK_RIPPLE_CENTER_WIDTH = 8.5;
export const CLICK_RIPPLE_MAX_AMOUNT = 1.35;
export const CLICK_RIPPLE_MAX_ACTIVE = 5;
export const CLICK_RIPPLE_BLOCK_THRESHOLD = 0.24;
export const CLICK_RIPPLE_BLOCK_ALPHA = 0.56;
export const CLICK_RIPPLE_GLOBAL_AFTERWAVE = 0;

export const EMPTY_HOVER_REBOUND_AFTER = 120;
export const EMPTY_HOVER_MEMORY = 560;

export const TEXT_SAMPLE_MAIN_STEP_X = 3;
export const TEXT_SAMPLE_MAIN_STEP_Y = 4;
export const TEXT_SAMPLE_SIGNATURE_STEP_X = 1;
export const TEXT_SAMPLE_SIGNATURE_STEP_Y = 1;

export const MOBILE_TITLE_TOP_Y = 0.29;
export const MOBILE_TITLE_LINE_GAP_Y = 0.15;
export const MOBILE_NAME_Y = 0.66;
export const MOBILE_TITLE_FONT_SCALE = 0.24;
export const MOBILE_NAME_FONT_SCALE = 0.135;
export const MOBILE_RIGHT_PADDING = 8;

export const MOBILE_TEXT_SAMPLE_MAIN_STEP_X = 3;
export const MOBILE_TEXT_SAMPLE_MAIN_STEP_Y = 4;
export const MOBILE_TEXT_SAMPLE_SIGNATURE_STEP_X = 1;
export const MOBILE_TEXT_SAMPLE_SIGNATURE_STEP_Y = 1;

export const VISUAL_EVENT_KINDS: VisualEventKind[] = ['letter-swap', 'color-life'];
export const VISUAL_EVENT_MIN_GAP = 2400;
export const VISUAL_EVENT_MAX_GAP = 5600;

export const LETTER_SWAP_DURATION = 1250;
export const LETTER_SWAP_MIN_TARGETS = 1;
export const LETTER_SWAP_MAX_TARGETS = 5;
export const LETTER_SWAP_IN_END = 0.28;
export const LETTER_SWAP_HOLD_END = 0.68;
export const LETTER_SWAP_OUT_END = 1;
export const LETTER_SWAP_TRANSITION_BLOCK_CHANCE = 0.42;
export const LETTER_SWAP_REPLACEMENT_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]<>#$%+=:;';

export const COLOR_LIFE_DURATION = 7200;
export const COLOR_LIFE_MIN_ORIGINS = 1;
export const COLOR_LIFE_MAX_ORIGINS = 6;
export const COLOR_LIFE_WAVE_SPEED = 0.021;
export const COLOR_LIFE_WAVE_WIDTH = 6.8;
export const COLOR_LIFE_DISTANCE_DECAY = 0.9;
export const COLOR_LIFE_MIN_STRENGTH = 0.55;
export const COLOR_LIFE_MAX_STRENGTH = 0.95;
export const COLOR_LIFE_STEP_MS = 82;
export const COLOR_LIFE_HANDOFF = 0.975;
export const COLOR_LIFE_MIN_ENERGY = 0.055;
export const COLOR_LIFE_BRANCH_CHANCE = 0.88;

export const NORMAL_GLYPH_POOL = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ{}[]<>/\\+=:;._-#$%';

export const DENSITY_REBOUND_DURATION = BLOCK_REBOUND_DURATION;
export const TICKER_BURST_PERIOD = 4600;
export const TICKER_BURST_DURATION = 1900;
export const IDLE_BURST_PERIOD = 7600;
export const IDLE_BURST_DURATION = 1150;
export const HELIX_START_DELAY = 1640;
export const HELIX_BURST_PERIOD = 9200;
export const HELIX_BURST_DURATION = 2200;

export const STATIC_PARTICLE_BOOT_MS = 1700;
export const QUALITY_DROP_FRAME_MS = 22;
export const QUALITY_RAISE_FRAME_MS = 10;
export const QUALITY_DROP_AFTER_FRAMES = 20;
export const QUALITY_RAISE_AFTER_FRAMES = 120;
