#include <string.h>
#include <uv.h>
#include <windows.h>

static inline void
bare__prepare_main(void) {
  if (GetConsoleWindow() == NULL) {
    freopen("NUL", "r", stdin);
    freopen("NUL", "w", stdout);
    freopen("NUL", "w", stderr);
  }
}

static inline int
bare__get_embedded_bundle(uv_buf_t *result) {
  HMODULE module = GetModuleHandle(NULL);

  PIMAGE_DOS_HEADER dos = (PIMAGE_DOS_HEADER) module;
  if (dos->e_magic != IMAGE_DOS_SIGNATURE) {
    return -1;
  }

  PIMAGE_NT_HEADERS nt = (PIMAGE_NT_HEADERS) ((BYTE *) module + dos->e_lfanew);
  if (nt->Signature != IMAGE_NT_SIGNATURE) {
    return -1;
  }

  PIMAGE_SECTION_HEADER sections = IMAGE_FIRST_SECTION(nt);

  for (int i = 0, n = nt->FileHeader.NumberOfSections; i < n; i++) {
    PIMAGE_SECTION_HEADER section = &sections[i];

    char name[9];
    name[8] = '\0';
    memcpy(name, section->Name, 8);

    if (strcmp(name, ".bare") == 0) {
      *result = uv_buf_init((char *) ((BYTE *) module + section->VirtualAddress), sections->Misc.VirtualSize);

      return 0;
    }
  }

  return -1;
}
