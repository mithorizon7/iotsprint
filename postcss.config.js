import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const fixMissingFrom = () => ({
  postcssPlugin: 'fix-missing-from',
  Once(root) {
    const fallbackSource = root.source;
    if (!fallbackSource?.input?.file) return;
    root.walkDecls((decl) => {
      if (!decl.source?.input?.file) {
        decl.source = fallbackSource;
      }
    });
  },
});

fixMissingFrom.postcss = true;

export default {
  plugins: [tailwindcss(), autoprefixer(), fixMissingFrom()],
};
