import { extendTheme } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  fonts: {
    heading: `'Orbitron', 'Rajdhani', system-ui, sans-serif`,
    body: `'Inter', system-ui, -apple-system, sans-serif`,
  },
  colors: {
    brand: {
      50:  '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    accent: {
      cyan: '#22d3ee',
      pink: '#f472b6',
      mint: '#6ee7b7',
    },
  },
  styles: {
    global: (props) => ({
      body: {
        bg: 'transparent',
        color: mode('gray.800', 'gray.100')(props),
      },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        fontFamily: `'Rajdhani', 'Inter', sans-serif`,
        fontWeight: '600',
        letterSpacing: '0.02em',
        borderRadius: 'xl',
        transition: 'all 0.2s ease',
        _hover: { transform: 'translateY(-1px)' },
        _active: { transform: 'translateY(0)' },
      },
      variants: {
        solid: (props) => {
          if (props.colorScheme === 'blue') {
            return {
              bgGradient: 'linear(135deg, brand.500, accent.cyan)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
              _hover: {
                bgGradient: 'linear(135deg, brand.600, accent.cyan)',
                boxShadow: '0 6px 20px rgba(139, 92, 246, 0.45)',
                transform: 'translateY(-1px)',
                _disabled: { bgGradient: 'linear(135deg, brand.500, accent.cyan)' },
              },
            };
          }
          if (props.colorScheme === 'green') {
            return {
              bgGradient: 'linear(135deg, #10b981, accent.mint)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              _hover: {
                bgGradient: 'linear(135deg, #059669, accent.mint)',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.45)',
              },
            };
          }
          if (props.colorScheme === 'red') {
            return {
              bgGradient: 'linear(135deg, #ef4444, #f472b6)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
              _hover: {
                bgGradient: 'linear(135deg, #dc2626, #f472b6)',
                boxShadow: '0 6px 20px rgba(239, 68, 68, 0.45)',
              },
            };
          }
          if (props.colorScheme === 'purple') {
            return {
              bgGradient: 'linear(135deg, brand.600, brand.400)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
              _hover: {
                bgGradient: 'linear(135deg, brand.700, brand.500)',
                boxShadow: '0 6px 20px rgba(124, 58, 237, 0.45)',
              },
            };
          }
          if (props.colorScheme === 'teal') {
            return {
              bgGradient: 'linear(135deg, #06b6d4, accent.cyan)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)',
              _hover: {
                bgGradient: 'linear(135deg, #0891b2, accent.cyan)',
                boxShadow: '0 6px 20px rgba(6, 182, 212, 0.45)',
              },
            };
          }
          return {};
        },
        outline: (props) => ({
          bg: mode('rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0.06)')(props),
          backdropFilter: 'blur(8px)',
          borderColor: mode('brand.300', 'brand.400')(props),
          color: mode('brand.700', 'brand.200')(props),
          _hover: {
            bg: mode('rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.12)')(props),
            borderColor: mode('brand.400', 'brand.300')(props),
          },
        }),
        ghost: (props) => ({
          color: mode('gray.700', 'gray.200')(props),
          _hover: { bg: mode('rgba(139, 92, 246, 0.08)', 'rgba(139, 92, 246, 0.18)')(props) },
        }),
      },
    },
    Input: {
      variants: {
        outline: (props) => ({
          field: {
            bg: mode('rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.05)')(props),
            backdropFilter: 'blur(8px)',
            borderColor: mode('rgba(167, 139, 250, 0.35)', 'rgba(255, 255, 255, 0.15)')(props),
            color: mode('gray.800', 'gray.100')(props),
            borderRadius: 'lg',
            _placeholder: { color: mode('gray.500', 'gray.500')(props) },
            _hover: { borderColor: mode('brand.300', 'rgba(255, 255, 255, 0.30)')(props) },
            _focus: {
              bg: mode('rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.08)')(props),
              borderColor: mode('brand.400', 'rgba(255, 255, 255, 0.40)')(props),
              boxShadow: mode(
                '0 0 0 3px rgba(139, 92, 246, 0.25)',
                '0 0 0 3px rgba(255, 255, 255, 0.10)'
              )(props),
            },
          },
        }),
      },
      defaultProps: { variant: 'outline' },
    },
    Select: {
      variants: {
        outline: (props) => ({
          field: {
            bg: mode('rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.05)')(props),
            backdropFilter: 'blur(8px)',
            borderColor: mode('rgba(167, 139, 250, 0.35)', 'rgba(255, 255, 255, 0.15)')(props),
            color: mode('gray.800', 'gray.100')(props),
            borderRadius: 'lg',
            _hover: { borderColor: mode('brand.300', 'rgba(255, 255, 255, 0.30)')(props) },
            _focus: {
              bg: mode('rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.08)')(props),
              borderColor: mode('brand.400', 'rgba(255, 255, 255, 0.40)')(props),
              boxShadow: mode(
                '0 0 0 3px rgba(139, 92, 246, 0.25)',
                '0 0 0 3px rgba(255, 255, 255, 0.10)'
              )(props),
            },
          },
          icon: {
            color: mode('gray.500', 'gray.400')(props),
          },
        }),
      },
    },
    Textarea: {
      variants: {
        outline: (props) => ({
          bg: mode('rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.05)')(props),
          backdropFilter: 'blur(8px)',
          borderColor: mode('rgba(167, 139, 250, 0.35)', 'rgba(255, 255, 255, 0.15)')(props),
          color: mode('gray.800', 'gray.100')(props),
          borderRadius: 'lg',
          _placeholder: { color: mode('gray.500', 'gray.500')(props) },
          _hover: { borderColor: mode('brand.300', 'rgba(255, 255, 255, 0.30)')(props) },
          _focus: {
            bg: mode('rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.08)')(props),
            borderColor: mode('brand.400', 'rgba(255, 255, 255, 0.40)')(props),
            boxShadow: mode(
              '0 0 0 3px rgba(139, 92, 246, 0.25)',
              '0 0 0 3px rgba(255, 255, 255, 0.10)'
            )(props),
          },
        }),
      },
    },
    NumberInput: {
      variants: {
        outline: (props) => ({
          field: {
            bg: mode('rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.05)')(props),
            color: mode('gray.800', 'gray.100')(props),
            borderColor: mode('rgba(167, 139, 250, 0.35)', 'rgba(255, 255, 255, 0.15)')(props),
            borderRadius: 'lg',
            _focus: {
              borderColor: mode('brand.400', 'rgba(255, 255, 255, 0.40)')(props),
              boxShadow: mode(
                '0 0 0 3px rgba(139, 92, 246, 0.25)',
                '0 0 0 3px rgba(255, 255, 255, 0.10)'
              )(props),
            },
          },
        }),
      },
    },
    Heading: {
      baseStyle: (props) => ({
        fontFamily: `'Orbitron', 'Rajdhani', system-ui, sans-serif`,
        letterSpacing: '0.01em',
        color: mode('gray.800', 'gray.100')(props),
      }),
    },
    FormLabel: {
      baseStyle: (props) => ({
        color: mode('gray.700', 'gray.300')(props),
        fontWeight: '600',
      }),
    },
    Badge: {
      baseStyle: {
        borderRadius: 'md',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: '700',
      },
    },
    Text: {
      baseStyle: (props) => ({
        color: mode('gray.800', 'gray.100')(props),
      }),
    },
    Table: {
      variants: {
        simple: (props) => ({
          th: {
            fontFamily: `'Rajdhani', sans-serif`,
            letterSpacing: '0.05em',
            color: mode('brand.700', 'brand.200')(props),
            borderColor: mode('rgba(167, 139, 250, 0.2)', 'rgba(167, 139, 250, 0.25)')(props),
          },
          td: {
            color: mode('gray.800', 'gray.100')(props),
            borderColor: mode('rgba(167, 139, 250, 0.15)', 'rgba(167, 139, 250, 0.2)')(props),
          },
        }),
      },
    },
    Drawer: {
      baseStyle: (props) => ({
        dialog: {
          bg: mode('rgba(255, 255, 255, 0.85)', 'rgba(15, 18, 50, 0.85)')(props),
        },
      }),
    },
    Modal: {
      baseStyle: (props) => ({
        dialog: {
          bg: mode('rgba(255, 255, 255, 0.95)', 'rgba(15, 18, 50, 0.95)')(props),
        },
      }),
    },
  },
});

export default theme;
