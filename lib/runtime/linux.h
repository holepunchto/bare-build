#include <stddef.h>
#include <uv.h>

extern char __bare_bundle_begin[] __attribute__((weak));
extern char __bare_bundle_end[] __attribute__((weak));

static inline int
bare__get_embedded_bundle(uv_buf_t *result) {
  if (__bare_bundle_begin == NULL || __bare_bundle_end == NULL) return -1;

  *result = uv_buf_init(__bare_bundle_begin, __bare_bundle_end - __bare_bundle_begin);

  return 0;
}
