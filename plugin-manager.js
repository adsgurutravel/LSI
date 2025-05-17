/**
 * AmriTravel System - Plugin Manager
 * 
 * A modular plugin system for managing integrations with third-party services.
 * This system allows for easy addition, removal, and configuration of plugins.
 */

class PluginManager {
  constructor() {
    this.plugins = {};
    this.activePlugins = [];
    this.hooks = {
      onBooking: [],
      onLead: [],
      onPayment: [],
      onMessage: [],
      onAdTrack: [],
      onTaskCreate: [],
      onVehicleUpdate: []
    };
  }

  /**
   * Register a new plugin with the system
   * @param {string} name - The name of the plugin
   * @param {object} plugin - The plugin object
   * @param {object} config - Configuration for the plugin
   */
  register(name, plugin, config = {}) {
    if (this.plugins[name]) {
      console.warn(`Plugin ${name} is already registered. Overwriting...`);
    }

    this.plugins[name] = {
      instance: plugin,
      config: config,
      active: false
    };

    console.log(`Plugin ${name} registered successfully.`);
    return this;
  }

  /**
   * Activate a registered plugin
   * @param {string} name - The name of the plugin to activate
   */
  activate(name) {
    if (!this.plugins[name]) {
      console.error(`Plugin ${name} is not registered.`);
      return false;
    }

    const plugin = this.plugins[name];
    
    // Initialize the plugin
    if (typeof plugin.instance.init === 'function') {
      plugin.instance.init(plugin.config);
    }

    // Register hooks
    if (plugin.instance.hooks) {
      Object.keys(plugin.instance.hooks).forEach(hookName => {
        if (this.hooks[hookName]) {
          this.hooks[hookName].push({
            name: name,
            callback: plugin.instance.hooks[hookName]
          });
        }
      });
    }

    plugin.active = true;
    this.activePlugins.push(name);
    console.log(`Plugin ${name} activated successfully.`);
    return true;
  }

  /**
   * Deactivate a plugin
   * @param {string} name - The name of the plugin to deactivate
   */
  deactivate(name) {
    if (!this.plugins[name] || !this.plugins[name].active) {
      console.error(`Plugin ${name} is not active or not registered.`);
      return false;
    }

    const plugin = this.plugins[name];

    // Remove hooks
    Object.keys(this.hooks).forEach(hookName => {
      this.hooks[hookName] = this.hooks[hookName].filter(hook => hook.name !== name);
    });

    // Call cleanup if available
    if (typeof plugin.instance.cleanup === 'function') {
      plugin.instance.cleanup();
    }

    plugin.active = false;
    this.activePlugins = this.activePlugins.filter(pluginName => pluginName !== name);
    console.log(`Plugin ${name} deactivated successfully.`);
    return true;
  }

  /**
   * Trigger a hook with data
   * @param {string} hookName - The name of the hook to trigger
   * @param {object} data - Data to pass to the hook callbacks
   */
  trigger(hookName, data = {}) {
    if (!this.hooks[hookName]) {
      console.error(`Hook ${hookName} does not exist.`);
      return [];
    }

    const results = [];
    for (const hook of this.hooks[hookName]) {
      try {
        const result = hook.callback(data);
        results.push({
          plugin: hook.name,
          result: result
        });
      } catch (error) {
        console.error(`Error in plugin ${hook.name} for hook ${hookName}:`, error);
        results.push({
          plugin: hook.name,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get a list of all registered plugins
   */
  getRegisteredPlugins() {
    return Object.keys(this.plugins);
  }

  /**
   * Get a list of all active plugins
   */
  getActivePlugins() {
    return this.activePlugins;
  }

  /**
   * Get configuration for a specific plugin
   * @param {string} name - The name of the plugin
   */
  getPluginConfig(name) {
    if (!this.plugins[name]) {
      console.error(`Plugin ${name} is not registered.`);
      return null;
    }
    return this.plugins[name].config;
  }

  /**
   * Update configuration for a specific plugin
   * @param {string} name - The name of the plugin
   * @param {object} config - New configuration object
   */
  updatePluginConfig(name, config) {
    if (!this.plugins[name]) {
      console.error(`Plugin ${name} is not registered.`);
      return false;
    }
    
    this.plugins[name].config = {
      ...this.plugins[name].config,
      ...config
    };
    
    // If plugin is active, reinitialize it
    if (this.plugins[name].active) {
      if (typeof this.plugins[name].instance.updateConfig === 'function') {
        this.plugins[name].instance.updateConfig(this.plugins[name].config);
      }
    }
    
    return true;
  }
}

// Export a singleton instance
const pluginManager = new PluginManager();
module.exports = pluginManager;
