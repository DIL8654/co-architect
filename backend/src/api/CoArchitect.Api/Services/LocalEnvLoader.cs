namespace CoArchitect.Api.Services;

public static class LocalEnvLoader
{
    private static readonly Dictionary<string, string[]> Aliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["ARCHITECTURE_AGENT_PROVIDER"] = ["ArchitectureAgent__Provider"],
        ["DATASTORE_PROVIDER"] = ["DataStore__Provider"],
        ["ARCHITECTURE_STORAGE_PROVIDER"] = ["ArchitectureStorage__Provider"],
        ["ARCHITECTURE_STORAGE_CONTAINER_SAS_URL"] = ["ArchitectureStorage__ContainerSasUrl"],
        ["DATABASE_CONNECTION_STRING"] = ["ConnectionStrings__Default", "ConnectionStrings__DefaultConnection"],
    };

    public static void LoadIntoProcessEnvironment()
    {
        var envFile = FindEnvFile();
        if (envFile is null)
        {
            return;
        }

        foreach (var rawLine in File.ReadAllLines(envFile))
        {
            var line = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
            {
                continue;
            }

            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = line[..separatorIndex].Trim();
            var value = line[(separatorIndex + 1)..].Trim();
            if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            value = TrimWrappingQuotes(value);
            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(key)))
            {
                Environment.SetEnvironmentVariable(key, value);
            }

            if (!Aliases.TryGetValue(key, out var mappedKeys))
            {
                continue;
            }

            foreach (var mappedKey in mappedKeys)
            {
                if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(mappedKey)))
                {
                    Environment.SetEnvironmentVariable(mappedKey, value);
                }
            }
        }
    }

    private static string? FindEnvFile()
    {
        var candidates = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), ".env"),
            Path.Combine(Directory.GetCurrentDirectory(), "backend", ".env"),
            Path.Combine(AppContext.BaseDirectory, ".env"),
        };

        foreach (var candidate in candidates)
        {
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        var directory = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (directory is not null)
        {
            var backendEnv = Path.Combine(directory.FullName, "backend", ".env");
            if (File.Exists(backendEnv))
            {
                return backendEnv;
            }

            var localEnv = Path.Combine(directory.FullName, ".env");
            if (File.Exists(localEnv))
            {
                return localEnv;
            }

            directory = directory.Parent;
        }

        return null;
    }

    private static string TrimWrappingQuotes(string value)
    {
        if (value.Length >= 2 &&
            ((value.StartsWith('\"') && value.EndsWith('\"')) ||
             (value.StartsWith('\'') && value.EndsWith('\''))))
        {
            return value[1..^1];
        }

        return value;
    }
}
