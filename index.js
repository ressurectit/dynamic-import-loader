const path = require('path'),
      fs = require('fs');

module.exports = function dynamicImportLoader(content, _, __)
{
    const options = this.getOptions();
    const importRegexp = `(import\\s*\\(\\s*(?:\`|"|'))`;

    //TODO: validate options
    
    let regexp;
    let moduleName;

    if(options.moduleName && typeof options.moduleName === 'string')
    {
        regexp = new RegExp(`${importRegexp}${options.moduleName}`, 'g');
        moduleName = options.moduleName;
    }
    else
    {
        throw new Error('error');
    }

    if(regexp.test(content))
    {
        const nodeModulesPath = getNodeModulesPath(this.resourcePath, moduleName);
        let packagePath = path.join(nodeModulesPath, moduleName);

        if(options.distPath)
        {
            packagePath = path.join(packagePath, options.distPath);
        }

        const relativePath = path.relative(path.dirname(this.resourcePath), packagePath).replace(/\\/g, '/');
        let regexpReplace;

        if(options.replace)
        {
            regexpReplace = concatRegexp(new RegExp(importRegexp, 'g'), options.replace);
        }
        else
        {
            regexpReplace = regexp;
        }

        let replacer;

        if(options.replacer)
        {
            replacer = function(...args)
            {
                const [_, p1] = args;
                const groups = args[args.length - 1];

                return `${p1}${options.replacer(relativePath, groups)}`;
            }
        }
        else
        {
            replacer = `\$1${relativePath}`;
        }

        return content.replace(regexpReplace, replacer);
    }

    return content;
};

function getNodeModulesPath(resourcePath, moduleName)
{
    const parentDirectory = path.dirname(resourcePath);

    if(path.basename(parentDirectory) === 'node_modules' &&
       fs.existsSync(path.join(parentDirectory, moduleName)))
    {
        return parentDirectory;
    }

    return getNodeModulesPath(parentDirectory, moduleName);
}

function concatRegexp(reg, exp)
{
    let flags = reg.flags + exp.flags;
    flags = Array.from(new Set(flags.split(''))).join();

    return new RegExp(reg.source + exp.source, flags);
}
