#include <mach-o/getsect.h>
#include <mach-o/loader.h>
#include <stddef.h>
#include <stdint.h>
#include <uv.h>

extern const struct mach_header_64 _mh_execute_header;

static inline int
bare__get_embedded_bundle(uv_buf_t *result) {
  size_t len;
  uint8_t *bundle = getsectiondata(&_mh_execute_header, "__BARE", "__bundle", &len);

  if (bundle == NULL) return -1;

  *result = uv_buf_init((char *) bundle, len);

  return 0;
}
