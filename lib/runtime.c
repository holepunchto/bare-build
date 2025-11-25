#include <assert.h>
#include <bare.h>
#include <js.h>
#include <log.h>
#include <path.h>
#include <rlimit.h>
#include <signal.h>
#include <uv.h>

#if defined(__APPLE__)
#include "runtime/apple.h"
#endif

#include "runtime.bundle.h"

static uv_barrier_t bare__platform_ready;
static uv_async_t bare__platform_shutdown;
static js_platform_t *bare__platform;

static void
bare__on_platform_shutdown(uv_async_t *handle) {
  uv_close((uv_handle_t *) handle, NULL);
}

static void
bare__on_platform_thread(void *data) {
  int err;

  uv_loop_t loop;
  err = uv_loop_init(&loop);
  assert(err == 0);

  err = uv_async_init(&loop, &bare__platform_shutdown, bare__on_platform_shutdown);
  assert(err == 0);

  err = js_create_platform(&loop, NULL, &bare__platform);
  assert(err == 0);

  uv_barrier_wait(&bare__platform_ready);

  err = uv_run(&loop, UV_RUN_DEFAULT);
  assert(err == 0);

  err = js_destroy_platform(bare__platform);
  assert(err == 0);

  err = uv_run(&loop, UV_RUN_DEFAULT);
  assert(err == 0);

  err = uv_loop_close(&loop);
  assert(err == 0);
}

int
main(int argc, char *argv[]) {
  int err;

#ifdef SIGPIPE
  signal(SIGPIPE, SIG_IGN);
#endif

  err = log_open("bare", 0);
  assert(err == 0);

  err = rlimit_set(rlimit_open_files, rlimit_infer);
  assert(err == 0);

  argv = uv_setup_args(argc, argv);

  err = uv_barrier_init(&bare__platform_ready, 2);
  assert(err == 0);

  uv_thread_t thread;
  err = uv_thread_create(&thread, bare__on_platform_thread, NULL);
  assert(err == 0);

  uv_barrier_wait(&bare__platform_ready);

  uv_barrier_destroy(&bare__platform_ready);

  uv_loop_t *loop = uv_default_loop();

  js_env_t *env;

  bare_t *bare;
  err = bare_setup(loop, bare__platform, &env, argc, (const char **) argv, NULL, &bare);
  assert(err == 0);

  uv_buf_t bundle;
  err = bare__get_embedded_bundle(&bundle);

  if (err == 0) {
    js_handle_scope_t *scope;
    err = js_open_handle_scope(env, &scope);
    assert(err == 0);

    uv_buf_t source = uv_buf_init((char *) runtime_bundle, runtime_bundle_len);

    js_value_t *module;
    err = bare_load(bare, "bare:/runtime.bundle", &source, &module);
    assert(err == 0);

    js_value_t *exports;
    err = js_get_named_property(env, module, "exports", &exports);
    assert(err == 0);

    js_value_t *start;
    err = js_get_named_property(env, exports, "start", &start);
    assert(err == 0);

    js_value_t *args[1];

    err = js_create_external_arraybuffer(env, bundle.base, bundle.len, NULL, NULL, &args[0]);
    assert(err == 0);

    err = js_call_function(env, exports, start, 1, args, NULL);
    (void) err;

    err = js_close_handle_scope(env, scope);
    assert(err == 0);
  } else {
    size_t len;

    char bin[4096];
    len = sizeof(bin);

    err = uv_exepath(bin, &len);
    assert(err == 0);

    size_t dir;
    err = path_dirname(bin, &dir, path_behavior_system);
    assert(err == 0);

    char bundle[4096];
    len = 4096;

    err = path_join(
#if defined(BARE_PLATFORM_DARWIN) || defined(BARE_PLATFORM_WIN32)
      (const char *[]) {bin, "..", "..", "Resources", "app.bundle", NULL},
#elif defined(BARE_PLATFORM_IOS)
      (const char *[]) {bin, "..", "app.bundle", NULL},
#elif defined(BARE_PLATFORM_LINUX)
      (const char *[]) {bin, "..", "..", "share", &bin[dir], "app.bundle", NULL},
#endif
      bundle,
      &len,
      path_behavior_system
    );
    assert(err == 0);

    err = bare_load(bare, bundle, NULL, NULL);
    (void) err;
  }

  err = bare_run(bare, UV_RUN_DEFAULT);
  assert(err == 0);

  int exit_code;
  err = bare_teardown(bare, UV_RUN_DEFAULT, &exit_code);
  assert(err == 0);

  err = uv_loop_close(loop);
  assert(err == 0);

  err = uv_async_send(&bare__platform_shutdown);
  assert(err == 0);

  uv_thread_join(&thread);

  err = log_close();
  assert(err == 0);

  return exit_code;
}
