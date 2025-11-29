cmake_minimum_required(VERSION 4.0)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-bare-bundle REQUIRED PATHS node_modules/cmake-bare-bundle)
find_package(cmake-fetch REQUIRED PATHS node_modules/cmake-fetch)

project(bare_build C)

fetch_package("github:holepunchto/bare@1.24.3")
fetch_package("github:holepunchto/libpath")

add_bare_bundle(
  bare_runtime_bundle
  ENTRY lib/runtime.js
  OUT lib/runtime.bundle.h
  BUILTINS lib/builtins.json
)

add_executable(bare_runtime)

target_sources(
  bare_runtime
  PRIVATE
    lib/runtime.c
    lib/runtime.bundle.h
    lib/runtime/apple.h
    lib/runtime/linux.h
    lib/runtime/windows.h
)

if(IOS)
  set(bare_runtime_rpath "@loader_path/Frameworks")
elseif(APPLE)
  set(bare_runtime_rpath "@loader_path/../Frameworks")
elseif(LINUX)
  set(bare_runtime_rpath "$ORIGIN/../lib")
else()
  set(${target}_rpath "")
endif()

set_target_properties(
  bare_runtime
  PROPERTIES
  OUTPUT_NAME bare

  INSTALL_RPATH "${bare_runtime_rpath}"
  BUILD_WITH_INSTALL_RPATH ON

  ENABLE_EXPORTS ON
  WINDOWS_EXPORT_ALL_SYMBOLS ON
)

target_link_libraries(
  bare_runtime
  PUBLIC
    $<LINK_LIBRARY:WHOLE_ARCHIVE,bare_static>
  PRIVATE
    log_static
    rlimit_static
    path_static
)

if(WIN32)
  file(READ "package.json" pkg)

  string(JSON version GET "${pkg}" version)

  file(READ "lib/runtime.manifest" manifest)

  string(CONFIGURE "${manifest}" manifest)

  file(GENERATE OUTPUT "runtime.manifest" CONTENT "${manifest}" NEWLINE_STYLE WIN32)

  target_sources(
    bare_runtime
    PRIVATE
      "${CMAKE_CURRENT_BINARY_DIR}/runtime.manifest"
  )
endif()

link_bare_module(bare_runtime bare-fs)
link_bare_module(bare_runtime bare-module)
link_bare_module(bare_runtime bare-module-lexer)
link_bare_module(bare_runtime bare-os)
link_bare_module(bare_runtime bare-url)

bare_target(target)

install(TARGETS bare_runtime RUNTIME DESTINATION ${target})
