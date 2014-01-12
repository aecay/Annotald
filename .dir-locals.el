((js2-mode . ((eval . (setq compilation-directory (vc-git-root default-directory)))
              (compile-command . "grunt jshint"))))
