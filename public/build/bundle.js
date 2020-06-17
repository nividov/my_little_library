
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.21.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Tailwindcss.svelte generated by Svelte v3.21.0 */

    function create_fragment(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tailwindcss> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Tailwindcss", $$slots, []);
    	return [];
    }

    class Tailwindcss extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tailwindcss",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.21.0 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[10]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (207:0) {#if componentParams}
    function create_if_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*componentParams*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty & /*componentParams*/ 2) switch_instance_changes.params = /*componentParams*/ ctx[1];

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[9]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(207:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(route, userData, ...conditions) {
    	// Check if we don't have userData
    	if (userData && typeof userData == "function") {
    		conditions = conditions && conditions.length ? conditions : [];
    		conditions.unshift(userData);
    		userData = undefined;
    	}

    	// Parameter route and each item of conditions must be functions
    	if (!route || typeof route != "function") {
    		throw Error("Invalid parameter route");
    	}

    	if (conditions && conditions.length) {
    		for (let i = 0; i < conditions.length; i++) {
    			if (!conditions[i] || typeof conditions[i] != "function") {
    				throw Error("Invalid parameter conditions[" + i + "]");
    			}
    		}
    	}

    	// Returns an object that contains all the functions to execute too
    	const obj = { route, userData };

    	if (conditions && conditions.length) {
    		obj.conditions = conditions;
    	}

    	// The _sveltesparouter flag is to confirm the object was created by this router
    	Object.defineProperty(obj, "_sveltesparouter", { value: true });

    	return obj;
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(getLocation(), // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    	});
    }

    function pop() {
    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		window.history.back();
    	});
    }

    function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    		try {
    			window.history.replaceState(undefined, undefined, dest);
    		} catch(e) {
    			// eslint-disable-next-line no-console
    			console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    		}

    		// The method above doesn't trigger the hashchange event, so let's do that manually
    		window.dispatchEvent(new Event("hashchange"));
    	});
    }

    function link(node) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	// Destination must start with '/'
    	const href = node.getAttribute("href");

    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute");
    	}

    	// Add # to every href attribute
    	node.setAttribute("href", "#" + href);
    }

    function nextTickPromise(cb) {
    	return new Promise(resolve => {
    			setTimeout(
    				() => {
    					resolve(cb());
    				},
    				0
    			);
    		});
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $loc,
    		$$unsubscribe_loc = noop;

    	validate_store(loc, "loc");
    	component_subscribe($$self, loc, $$value => $$invalidate(4, $loc = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_loc());
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent} component - Svelte component for the route
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.route;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    			} else {
    				this.component = component;
    				this.conditions = [];
    				this.userData = undefined;
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, remove it before we run the matching
    			if (prefix && path.startsWith(prefix)) {
    				path = path.substr(prefix.length) || "/";
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				out[this._keys[i]] = matches[++i] || null;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {SvelteComponent} component - Svelte component
     * @property {string} name - Name of the Svelte component
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {Object} [userData] - Custom data passed by the user
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	const dispatchNextTick = (name, detail) => {
    		// Execute this code when the current call stack is complete
    		setTimeout(
    			() => {
    				dispatch(name, detail);
    			},
    			0
    		);
    	};

    	const writable_props = ["routes", "prefix"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, []);

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		nextTickPromise,
    		createEventDispatcher,
    		regexparam,
    		routes,
    		prefix,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		dispatch,
    		dispatchNextTick,
    		$loc
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*component, $loc*/ 17) {
    			// Handle hash change events
    			// Listen to changes in the $loc store and update the page
    			 {
    				// Find a route matching the location
    				$$invalidate(0, component = null);

    				let i = 0;

    				while (!component && i < routesList.length) {
    					const match = routesList[i].match($loc.location);

    					if (match) {
    						const detail = {
    							component: routesList[i].component,
    							name: routesList[i].component.name,
    							location: $loc.location,
    							querystring: $loc.querystring,
    							userData: routesList[i].userData
    						};

    						// Check if the route can be loaded - if all conditions succeed
    						if (!routesList[i].checkConditions(detail)) {
    							// Trigger an event to notify the user
    							dispatchNextTick("conditionsFailed", detail);

    							break;
    						}

    						$$invalidate(0, component = routesList[i].component);

    						// Set componentParams onloy if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    						// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    						if (match && typeof match == "object" && Object.keys(match).length) {
    							$$invalidate(1, componentParams = match);
    						} else {
    							$$invalidate(1, componentParams = null);
    						}

    						dispatchNextTick("routeLoaded", detail);
    					}

    					i++;
    				}
    			}
    		}
    	};

    	return [
    		component,
    		componentParams,
    		routes,
    		prefix,
    		$loc,
    		RouteItem,
    		routesList,
    		dispatch,
    		dispatchNextTick,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { routes: 2, prefix: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Home.svelte generated by Svelte v3.21.0 */
    const file = "src\\Components\\Home.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let t1;
    	let button0;
    	let t3;
    	let button1;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Hello and Welcome to your little library v2";
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "Add entry";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Show list";
    			add_location(div, file, 12, 0, 149);
    			add_location(button0, file, 13, 0, 205);
    			add_location(button1, file, 14, 0, 274);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button1, anchor);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[0], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[1], false, false, false)
    			];
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function changePage(destination) {
    	push(destination);
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Home", $$slots, []);
    	const click_handler = () => changePage("/AddEntry");
    	const click_handler_1 = () => changePage("/BookList");
    	$$self.$capture_state = () => ({ push, changePage });
    	return [click_handler, click_handler_1];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const writableLocalStorage = (key, startValue) => {
      const { subscribe, set } = writable(startValue);
      
    	return {
        subscribe,
        set,
        useLocalStorage: () => {
          const json = localStorage.getItem(key);
          if (json) {
            set(JSON.parse(json));
          }
          
          subscribe(current => {
            localStorage.setItem(key, JSON.stringify(current));
          });
        },
        sort(key, sorted){
          let obj = get_store_value(this);
          obj.sort(function(a, b) {
            let nameA = a[key];
            let nameB = b[key];
            if(typeof a[key] !== "boolean"){  //check if boolean. if not, skip the uppercase
              nameA = nameA.toUpperCase(); // ignore upper and lowercase
              nameB = nameB.toUpperCase(); // ignore upper and lowercase
            }
            if (nameA < nameB) {
              if(sorted){
                return -1;
              } else {
                return 1
              }
            }
            if (nameA > nameB) {
              if(!sorted){
                return -1;
              } else {
                return 1
              }
            }
          });
          this.set(obj);
        }
      };
    };

    const entries = writableLocalStorage('entries', [
        {
          title: "Hello",
          author: "Harry Windsor",
          genre: "Fantasy",
          location: "Algund",
          read: false
        },
        {
          title: "Fresh",
          author: "Freshi Alman",
          genre: "Comic",
          location: "Algund",
          read: true
        },
        {
          title: "Test",
          author: "Test",
          genre: "tset",
          location: "Brixen",
          read: true
        }
    ]);

    function addNewEntry(userInput) {
        let dataStore = get_store_value(entries);
        let newObject = processInput(userInput);
        if(!checkForDuplicates()){
            addInputToData(newObject, dataStore);
        }
    }

    function changeEntry(userInput, index){
        let dataStore = get_store_value(entries);
        let newObject = processInput(userInput);
        if(!checkForDuplicates()){
            changeData(newObject, dataStore, index);
        }
    }

    function processInput(input){
        let form = input.currentTarget;
        let title = form.elements.namedItem("title").value;
        let author = form.elements.namedItem("author").value;
        let genre = form.elements.namedItem("genre").value;    
        let location = form.elements.namedItem("location").value;
        let read = form.elements.namedItem("read").checked;


        return {
            title: title,
            author: author,
            genre: genre,
            location: location,
            read: read
        }
    }

    function checkForDuplicates(input, dataStore){
        //both these methods do not work, i don't know why...

        // console.log(get(entries).indexOf(input))    //ergebnis ist immer -1?? wieso??

        // for(let i = 0; i < dataStore.length; i++){
        //     console.log(dataStore[i], input)
        //     if(dataStore[i] === input){
        //         alert("Dieser Eintrag existiert bereits")
        //         return true
        //     }
        // }
    }

    function addInputToData(newEntry, dataStore){
        entries.set([...dataStore, newEntry]);
    }

    function changeData(newEntry, dataStore, index){
        dataStore[index] = newEntry;
        entries.set(dataStore);
    }

    function deleteEntry(index){
        let dataStore = get_store_value(entries);
        dataStore.splice(index, 1);
        entries.set(dataStore);
    }

    /* src\Components\HomeButton.svelte generated by Svelte v3.21.0 */
    const file$1 = "src\\Components\\HomeButton.svelte";

    function create_fragment$3(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Home";
    			add_location(button, file$1, 5, 0, 68);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, button, anchor);
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[0], false, false, false);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<HomeButton> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("HomeButton", $$slots, []);

    	const click_handler = () => {
    		push("/");
    	};

    	$$self.$capture_state = () => ({ push });
    	return [click_handler];
    }

    class HomeButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HomeButton",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Components\AddEntry.svelte generated by Svelte v3.21.0 */
    const file$2 = "src\\Components\\AddEntry.svelte";

    function create_fragment$4(ctx) {
    	let t0;
    	let div;
    	let t2;
    	let form;
    	let label0;
    	let t4;
    	let input0;
    	let br0;
    	let t5;
    	let label1;
    	let t7;
    	let input1;
    	let br1;
    	let t8;
    	let label2;
    	let t10;
    	let input2;
    	let br2;
    	let t11;
    	let label3;
    	let t13;
    	let input3;
    	let br3;
    	let t14;
    	let label4;
    	let t16;
    	let input4;
    	let br4;
    	let t17;
    	let button;
    	let current;
    	let dispose;
    	const homebutton = new HomeButton({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(homebutton.$$.fragment);
    			t0 = space();
    			div = element("div");
    			div.textContent = "Add a new entry";
    			t2 = space();
    			form = element("form");
    			label0 = element("label");
    			label0.textContent = "Titel";
    			t4 = space();
    			input0 = element("input");
    			br0 = element("br");
    			t5 = space();
    			label1 = element("label");
    			label1.textContent = "Autor";
    			t7 = space();
    			input1 = element("input");
    			br1 = element("br");
    			t8 = space();
    			label2 = element("label");
    			label2.textContent = "Genre";
    			t10 = space();
    			input2 = element("input");
    			br2 = element("br");
    			t11 = space();
    			label3 = element("label");
    			label3.textContent = "Standort";
    			t13 = space();
    			input3 = element("input");
    			br3 = element("br");
    			t14 = space();
    			label4 = element("label");
    			label4.textContent = "schon gelesen?";
    			t16 = space();
    			input4 = element("input");
    			br4 = element("br");
    			t17 = space();
    			button = element("button");
    			button.textContent = "Los!";
    			add_location(div, file$2, 14, 0, 286);
    			attr_dev(label0, "for", "title");
    			add_location(label0, file$2, 17, 4, 378);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "title");
    			add_location(input0, file$2, 18, 4, 418);
    			add_location(br0, file$2, 18, 36, 450);
    			attr_dev(label1, "for", "author");
    			add_location(label1, file$2, 19, 4, 460);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "name", "author");
    			add_location(input1, file$2, 20, 4, 501);
    			add_location(br1, file$2, 20, 37, 534);
    			attr_dev(label2, "for", "genre");
    			add_location(label2, file$2, 21, 4, 544);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "name", "genre");
    			add_location(input2, file$2, 22, 4, 584);
    			add_location(br2, file$2, 22, 36, 616);
    			attr_dev(label3, "for", "location");
    			add_location(label3, file$2, 23, 4, 626);
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "name", "location");
    			add_location(input3, file$2, 24, 4, 672);
    			add_location(br3, file$2, 24, 39, 707);
    			attr_dev(label4, "for", "location");
    			add_location(label4, file$2, 25, 4, 717);
    			attr_dev(input4, "type", "checkbox");
    			attr_dev(input4, "name", "read");
    			add_location(input4, file$2, 26, 4, 769);
    			add_location(br4, file$2, 26, 39, 804);
    			attr_dev(button, "type", "submit");
    			add_location(button, file$2, 27, 4, 814);
    			attr_dev(form, "name", "form");
    			add_location(form, file$2, 16, 0, 316);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			mount_component(homebutton, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, label0);
    			append_dev(form, t4);
    			append_dev(form, input0);
    			append_dev(form, br0);
    			append_dev(form, t5);
    			append_dev(form, label1);
    			append_dev(form, t7);
    			append_dev(form, input1);
    			append_dev(form, br1);
    			append_dev(form, t8);
    			append_dev(form, label2);
    			append_dev(form, t10);
    			append_dev(form, input2);
    			append_dev(form, br2);
    			append_dev(form, t11);
    			append_dev(form, label3);
    			append_dev(form, t13);
    			append_dev(form, input3);
    			append_dev(form, br3);
    			append_dev(form, t14);
    			append_dev(form, label4);
    			append_dev(form, t16);
    			append_dev(form, input4);
    			append_dev(form, br4);
    			append_dev(form, t17);
    			append_dev(form, button);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(form, "submit", prevent_default(submitForm), false, true, false);
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(homebutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(homebutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(homebutton, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(form);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function submitForm(event) {
    	addNewEntry(event);
    	push("/BookList");
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AddEntry> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("AddEntry", $$slots, []);

    	$$self.$capture_state = () => ({
    		addNewEntry,
    		push,
    		HomeButton,
    		submitForm
    	});

    	return [];
    }

    class AddEntry extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddEntry",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Components\ItemDetails.svelte generated by Svelte v3.21.0 */
    const file$3 = "src\\Components\\ItemDetails.svelte";

    function create_fragment$5(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div2;
    	let div1;
    	let span;
    	let t2;
    	let form;
    	let label0;
    	let t4;
    	let input0;
    	let input0_value_value;
    	let br0;
    	let t5;
    	let label1;
    	let t7;
    	let input1;
    	let input1_value_value;
    	let br1;
    	let t8;
    	let label2;
    	let t10;
    	let input2;
    	let input2_value_value;
    	let br2;
    	let t11;
    	let label3;
    	let t13;
    	let input3;
    	let input3_value_value;
    	let br3;
    	let t14;
    	let label4;
    	let t16;
    	let input4;
    	let input4_checked_value;
    	let br4;
    	let t17;
    	let button0;
    	let t19;
    	let button1;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "x";
    			t2 = space();
    			form = element("form");
    			label0 = element("label");
    			label0.textContent = "Titel";
    			t4 = space();
    			input0 = element("input");
    			br0 = element("br");
    			t5 = space();
    			label1 = element("label");
    			label1.textContent = "Autor";
    			t7 = space();
    			input1 = element("input");
    			br1 = element("br");
    			t8 = space();
    			label2 = element("label");
    			label2.textContent = "Genre";
    			t10 = space();
    			input2 = element("input");
    			br2 = element("br");
    			t11 = space();
    			label3 = element("label");
    			label3.textContent = "Standort";
    			t13 = space();
    			input3 = element("input");
    			br3 = element("br");
    			t14 = space();
    			label4 = element("label");
    			label4.textContent = "schon gelesen?";
    			t16 = space();
    			input4 = element("input");
    			br4 = element("br");
    			t17 = space();
    			button0 = element("button");
    			button0.textContent = "Save";
    			t19 = space();
    			button1 = element("button");
    			button1.textContent = "Delete";
    			attr_dev(div0, "class", "bg-black opacity-50 fixed inset-0 ");
    			add_location(div0, file$3, 16, 1, 393);
    			attr_dev(span, "class", "cursor-pointer");
    			add_location(span, file$3, 18, 59, 576);
    			attr_dev(div1, "class", "text-right");
    			add_location(div1, file$3, 18, 12, 529);
    			attr_dev(label0, "for", "title");
    			add_location(label0, file$3, 25, 16, 795);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "title");
    			input0.value = input0_value_value = /*entry*/ ctx[1].title || "";
    			add_location(input0, file$3, 26, 16, 847);
    			add_location(br0, file$3, 26, 72, 903);
    			attr_dev(label1, "for", "author");
    			add_location(label1, file$3, 27, 16, 925);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "name", "author");
    			input1.value = input1_value_value = /*entry*/ ctx[1].author || "";
    			add_location(input1, file$3, 28, 16, 978);
    			add_location(br1, file$3, 28, 74, 1036);
    			attr_dev(label2, "for", "genre");
    			add_location(label2, file$3, 29, 16, 1058);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "name", "genre");
    			input2.value = input2_value_value = /*entry*/ ctx[1].genre || "";
    			add_location(input2, file$3, 30, 16, 1110);
    			add_location(br2, file$3, 30, 72, 1166);
    			attr_dev(label3, "for", "location");
    			add_location(label3, file$3, 31, 16, 1188);
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "name", "location");
    			input3.value = input3_value_value = /*entry*/ ctx[1].location || "";
    			add_location(input3, file$3, 32, 16, 1246);
    			add_location(br3, file$3, 32, 78, 1308);
    			attr_dev(label4, "for", "location");
    			add_location(label4, file$3, 33, 16, 1330);
    			attr_dev(input4, "type", "checkbox");
    			attr_dev(input4, "name", "read");
    			input4.checked = input4_checked_value = /*entry*/ ctx[1].read;
    			add_location(input4, file$3, 34, 16, 1394);
    			add_location(br4, file$3, 34, 72, 1450);
    			attr_dev(button0, "type", "submit");
    			add_location(button0, file$3, 35, 16, 1472);
    			add_location(form, file$3, 20, 12, 635);
    			add_location(button1, file$3, 37, 12, 1542);
    			attr_dev(div2, "class", "fixed inset-0 mx-32 px-8 pt-8 my-16 bg-white");
    			add_location(div2, file$3, 17, 8, 457);
    			attr_dev(div3, "class", "fixed inset-0");
    			add_location(div3, file$3, 15, 0, 363);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, span);
    			append_dev(div2, t2);
    			append_dev(div2, form);
    			append_dev(form, label0);
    			append_dev(form, t4);
    			append_dev(form, input0);
    			append_dev(form, br0);
    			append_dev(form, t5);
    			append_dev(form, label1);
    			append_dev(form, t7);
    			append_dev(form, input1);
    			append_dev(form, br1);
    			append_dev(form, t8);
    			append_dev(form, label2);
    			append_dev(form, t10);
    			append_dev(form, input2);
    			append_dev(form, br2);
    			append_dev(form, t11);
    			append_dev(form, label3);
    			append_dev(form, t13);
    			append_dev(form, input3);
    			append_dev(form, br3);
    			append_dev(form, t14);
    			append_dev(form, label4);
    			append_dev(form, t16);
    			append_dev(form, input4);
    			append_dev(form, br4);
    			append_dev(form, t17);
    			append_dev(form, button0);
    			append_dev(div2, t19);
    			append_dev(div2, button1);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(div1, "click", /*closeDetail*/ ctx[2], false, false, false),
    				listen_dev(form, "submit", prevent_default(/*submit_handler*/ ctx[5]), false, true, false),
    				listen_dev(button1, "click", /*click_handler*/ ctx[6], false, false, false)
    			];
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $entries;
    	validate_store(entries, "entries");
    	component_subscribe($$self, entries, $$value => $$invalidate(3, $entries = $$value));
    	const dispatch = createEventDispatcher();
    	let { itemNr } = $$props;
    	let entry = $entries[itemNr];

    	function closeDetail() {
    		dispatch("closeDetail");
    	}

    	const writable_props = ["itemNr"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ItemDetails> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ItemDetails", $$slots, []);

    	const submit_handler = e => {
    		changeEntry(e, itemNr);
    		closeDetail();
    	};

    	const click_handler = () => deleteEntry(itemNr);

    	$$self.$set = $$props => {
    		if ("itemNr" in $$props) $$invalidate(0, itemNr = $$props.itemNr);
    	};

    	$$self.$capture_state = () => ({
    		changeEntry,
    		deleteEntry,
    		entries,
    		createEventDispatcher,
    		dispatch,
    		itemNr,
    		entry,
    		closeDetail,
    		$entries
    	});

    	$$self.$inject_state = $$props => {
    		if ("itemNr" in $$props) $$invalidate(0, itemNr = $$props.itemNr);
    		if ("entry" in $$props) $$invalidate(1, entry = $$props.entry);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [itemNr, entry, closeDetail, $entries, dispatch, submit_handler, click_handler];
    }

    class ItemDetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { itemNr: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ItemDetails",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*itemNr*/ ctx[0] === undefined && !("itemNr" in props)) {
    			console.warn("<ItemDetails> was created without expected prop 'itemNr'");
    		}
    	}

    	get itemNr() {
    		throw new Error("<ItemDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set itemNr(value) {
    		throw new Error("<ItemDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\BookList.svelte generated by Svelte v3.21.0 */
    const file$4 = "src\\Components\\BookList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[19] = list;
    	child_ctx[20] = i;
    	return child_ctx;
    }

    // (88:4) {#each $entries as item, i}
    function create_each_block(ctx) {
    	let div6;
    	let div0;
    	let t0_value = /*item*/ ctx[18].title + "";
    	let t0;
    	let t1;
    	let div1;
    	let t2_value = (/*item*/ ctx[18].author || "-") + "";
    	let t2;
    	let t3;
    	let div2;
    	let t4_value = (/*item*/ ctx[18].genre || "-") + "";
    	let t4;
    	let t5;
    	let div3;
    	let t6_value = (/*item*/ ctx[18].location || "-") + "";
    	let t6;
    	let t7;
    	let div4;
    	let input;
    	let t8;
    	let div5;
    	let t10;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[16].call(input, /*item*/ ctx[18]);
    	}

    	function click_handler_7(...args) {
    		return /*click_handler_7*/ ctx[17](/*i*/ ctx[20], ...args);
    	}

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			t4 = text(t4_value);
    			t5 = space();
    			div3 = element("div");
    			t6 = text(t6_value);
    			t7 = space();
    			div4 = element("div");
    			input = element("input");
    			t8 = space();
    			div5 = element("div");
    			div5.textContent = "Bearbeiten";
    			t10 = space();
    			attr_dev(div0, "class", "flex-1");
    			add_location(div0, file$4, 89, 12, 2761);
    			attr_dev(div1, "class", "flex-1");
    			add_location(div1, file$4, 90, 12, 2814);
    			attr_dev(div2, "class", "flex-1");
    			add_location(div2, file$4, 91, 12, 2875);
    			attr_dev(div3, "class", "flex-1");
    			add_location(div3, file$4, 92, 12, 2935);
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file$4, 94, 16, 3036);
    			attr_dev(div4, "class", "flex-1");
    			add_location(div4, file$4, 93, 12, 2998);
    			attr_dev(div5, "class", "flex-1");
    			add_location(div5, file$4, 96, 12, 3119);
    			attr_dev(div6, "class", "flex justify-between");
    			add_location(div6, file$4, 88, 8, 2713);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div0);
    			append_dev(div0, t0);
    			append_dev(div6, t1);
    			append_dev(div6, div1);
    			append_dev(div1, t2);
    			append_dev(div6, t3);
    			append_dev(div6, div2);
    			append_dev(div2, t4);
    			append_dev(div6, t5);
    			append_dev(div6, div3);
    			append_dev(div3, t6);
    			append_dev(div6, t7);
    			append_dev(div6, div4);
    			append_dev(div4, input);
    			input.checked = /*item*/ ctx[18].read;
    			append_dev(div6, t8);
    			append_dev(div6, div5);
    			append_dev(div6, t10);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input, "change", input_change_handler),
    				listen_dev(div5, "click", click_handler_7, false, false, false)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$entries*/ 8 && t0_value !== (t0_value = /*item*/ ctx[18].title + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$entries*/ 8 && t2_value !== (t2_value = (/*item*/ ctx[18].author || "-") + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$entries*/ 8 && t4_value !== (t4_value = (/*item*/ ctx[18].genre || "-") + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*$entries*/ 8 && t6_value !== (t6_value = (/*item*/ ctx[18].location || "-") + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*$entries*/ 8) {
    				input.checked = /*item*/ ctx[18].read;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(88:4) {#each $entries as item, i}",
    		ctx
    	});

    	return block;
    }

    // (102:0) {#if itemDetails}
    function create_if_block$1(ctx) {
    	let current;

    	const itemdetails = new ItemDetails({
    			props: { itemNr: /*itemNr*/ ctx[1] },
    			$$inline: true
    		});

    	itemdetails.$on("closeDetail", /*detailClosed*/ ctx[6]);

    	const block = {
    		c: function create() {
    			create_component(itemdetails.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(itemdetails, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const itemdetails_changes = {};
    			if (dirty & /*itemNr*/ 2) itemdetails_changes.itemNr = /*itemNr*/ ctx[1];
    			itemdetails.$set(itemdetails_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(itemdetails.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(itemdetails.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(itemdetails, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(102:0) {#if itemDetails}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let t0;
    	let button0;
    	let t2;
    	let button1;
    	let t4;
    	let div0;
    	let t6;
    	let div8;
    	let div7;
    	let div1;
    	let t7;
    	let span0;
    	let t8_value = (/*sortingDirection*/ ctx[2] ? "^" : "v") + "";
    	let t8;
    	let t9;
    	let div2;
    	let t10;
    	let span1;
    	let t11_value = (/*sortingDirection*/ ctx[2] ? "^" : "v") + "";
    	let t11;
    	let t12;
    	let div3;
    	let t13;
    	let span2;
    	let t14_value = (/*sortingDirection*/ ctx[2] ? "^" : "v") + "";
    	let t14;
    	let t15;
    	let div4;
    	let t16;
    	let span3;
    	let t17_value = (/*sortingDirection*/ ctx[2] ? "^" : "v") + "";
    	let t17;
    	let t18;
    	let div5;
    	let t19;
    	let span4;
    	let t20_value = (/*sortingDirection*/ ctx[2] ? "^" : "v") + "";
    	let t20;
    	let t21;
    	let div6;
    	let t22;
    	let t23;
    	let if_block_anchor;
    	let current;
    	let dispose;
    	const homebutton = new HomeButton({ $$inline: true });
    	let each_value = /*$entries*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block = /*itemDetails*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			create_component(homebutton.$$.fragment);
    			t0 = space();
    			button0 = element("button");
    			button0.textContent = "Buch hinzufügen";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "Daten herunterladen";
    			t4 = space();
    			div0 = element("div");
    			div0.textContent = "BookList";
    			t6 = space();
    			div8 = element("div");
    			div7 = element("div");
    			div1 = element("div");
    			t7 = text("Titel \r\n            ");
    			span0 = element("span");
    			t8 = text(t8_value);
    			t9 = space();
    			div2 = element("div");
    			t10 = text("Autor\r\n            ");
    			span1 = element("span");
    			t11 = text(t11_value);
    			t12 = space();
    			div3 = element("div");
    			t13 = text("Genre\r\n            ");
    			span2 = element("span");
    			t14 = text(t14_value);
    			t15 = space();
    			div4 = element("div");
    			t16 = text("Standort\r\n            ");
    			span3 = element("span");
    			t17 = text(t17_value);
    			t18 = space();
    			div5 = element("div");
    			t19 = text("Gelesen?\r\n            ");
    			span4 = element("span");
    			t20 = text(t20_value);
    			t21 = space();
    			div6 = element("div");
    			t22 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t23 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(button0, file$4, 58, 0, 1609);
    			add_location(button1, file$4, 59, 0, 1684);
    			add_location(div0, file$4, 61, 0, 1759);
    			add_location(span0, file$4, 67, 12, 1891);
    			attr_dev(div1, "class", "flex-1");
    			add_location(div1, file$4, 65, 8, 1837);
    			add_location(span1, file$4, 71, 12, 2048);
    			attr_dev(div2, "class", "flex-1");
    			add_location(div2, file$4, 69, 8, 1995);
    			add_location(span2, file$4, 75, 12, 2206);
    			attr_dev(div3, "class", "flex-1");
    			add_location(div3, file$4, 73, 8, 2153);
    			add_location(span3, file$4, 79, 12, 2366);
    			attr_dev(div4, "class", "flex-1");
    			add_location(div4, file$4, 77, 8, 2310);
    			add_location(span4, file$4, 83, 12, 2529);
    			attr_dev(div5, "class", "flex-1");
    			add_location(div5, file$4, 81, 8, 2473);
    			attr_dev(div6, "class", "flex-1");
    			add_location(div6, file$4, 85, 8, 2632);
    			attr_dev(div7, "class", "flex justify-between");
    			add_location(div7, file$4, 64, 4, 1793);
    			add_location(div8, file$4, 63, 0, 1782);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			mount_component(homebutton, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div7);
    			append_dev(div7, div1);
    			append_dev(div1, t7);
    			append_dev(div1, span0);
    			append_dev(span0, t8);
    			append_dev(div7, t9);
    			append_dev(div7, div2);
    			append_dev(div2, t10);
    			append_dev(div2, span1);
    			append_dev(span1, t11);
    			append_dev(div7, t12);
    			append_dev(div7, div3);
    			append_dev(div3, t13);
    			append_dev(div3, span2);
    			append_dev(span2, t14);
    			append_dev(div7, t15);
    			append_dev(div7, div4);
    			append_dev(div4, t16);
    			append_dev(div4, span3);
    			append_dev(span3, t17);
    			append_dev(div7, t18);
    			append_dev(div7, div5);
    			append_dev(div5, t19);
    			append_dev(div5, span4);
    			append_dev(span4, t20);
    			append_dev(div7, t21);
    			append_dev(div7, div6);
    			append_dev(div8, t22);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div8, null);
    			}

    			insert_dev(target, t23, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[9], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[10], false, false, false),
    				listen_dev(span0, "click", /*click_handler_2*/ ctx[11], false, false, false),
    				listen_dev(span1, "click", /*click_handler_3*/ ctx[12], false, false, false),
    				listen_dev(span2, "click", /*click_handler_4*/ ctx[13], false, false, false),
    				listen_dev(span3, "click", /*click_handler_5*/ ctx[14], false, false, false),
    				listen_dev(span4, "click", /*click_handler_6*/ ctx[15], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*sortingDirection*/ 4) && t8_value !== (t8_value = (/*sortingDirection*/ ctx[2] ? "^" : "v") + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty & /*sortingDirection*/ 4) && t11_value !== (t11_value = (/*sortingDirection*/ ctx[2] ? "^" : "v") + "")) set_data_dev(t11, t11_value);
    			if ((!current || dirty & /*sortingDirection*/ 4) && t14_value !== (t14_value = (/*sortingDirection*/ ctx[2] ? "^" : "v") + "")) set_data_dev(t14, t14_value);
    			if ((!current || dirty & /*sortingDirection*/ 4) && t17_value !== (t17_value = (/*sortingDirection*/ ctx[2] ? "^" : "v") + "")) set_data_dev(t17, t17_value);
    			if ((!current || dirty & /*sortingDirection*/ 4) && t20_value !== (t20_value = (/*sortingDirection*/ ctx[2] ? "^" : "v") + "")) set_data_dev(t20, t20_value);

    			if (dirty & /*showDetail, $entries*/ 24) {
    				each_value = /*$entries*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div8, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*itemDetails*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*itemDetails*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(homebutton.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(homebutton.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(homebutton, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div8);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t23);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function changePage$1(destination) {
    	push(destination);
    }

    function saveData(data) {
    	let fileContent = get_store_value(data);
    	let bb = new Blob([JSON.stringify(fileContent, null, 2)], { type: "application/json" });
    	let a = document.createElement("a");
    	a.download = "download.txt";
    	a.href = window.URL.createObjectURL(bb);
    	a.click();
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $entries;
    	validate_store(entries, "entries");
    	component_subscribe($$self, entries, $$value => $$invalidate(3, $entries = $$value));
    	entries.useLocalStorage();

    	onMount(() => {
    		sortAsBefore();
    	});

    	let itemDetails = false;
    	let itemNr;

    	function showDetail(itemNumber) {
    		$$invalidate(0, itemDetails = true);
    		$$invalidate(1, itemNr = itemNumber);
    	}

    	let lastSorted = localStorage.getItem("lastSorted") || "author";
    	let sortingDirection = JSON.parse(localStorage.getItem("sortingDirection"));

    	function sorting(key) {
    		localStorage.setItem("lastSorted", key);
    		let storageBool = JSON.parse(localStorage.getItem("sortingDirection"));
    		localStorage.setItem("sortingDirection", !storageBool);
    		$$invalidate(2, sortingDirection = !storageBool);
    		entries.sort(key, sortingDirection);
    	}

    	function sortAsBefore() {
    		entries.sort(lastSorted, sortingDirection);
    	}

    	function detailClosed() {
    		$$invalidate(0, itemDetails = false);
    		sortAsBefore();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BookList> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("BookList", $$slots, []);
    	const click_handler = () => changePage$1("/AddEntry");
    	const click_handler_1 = () => saveData(entries);
    	const click_handler_2 = () => sorting("title");
    	const click_handler_3 = () => sorting("author");
    	const click_handler_4 = () => sorting("genre");
    	const click_handler_5 = () => sorting("location");
    	const click_handler_6 = () => sorting("read");

    	function input_change_handler(item) {
    		item.read = this.checked;
    		entries.set($entries);
    	}

    	const click_handler_7 = i => showDetail(i);

    	$$self.$capture_state = () => ({
    		get: get_store_value,
    		push,
    		entries,
    		onMount,
    		HomeButton,
    		ItemDetails,
    		changePage: changePage$1,
    		itemDetails,
    		itemNr,
    		showDetail,
    		lastSorted,
    		sortingDirection,
    		sorting,
    		sortAsBefore,
    		detailClosed,
    		saveData,
    		$entries
    	});

    	$$self.$inject_state = $$props => {
    		if ("itemDetails" in $$props) $$invalidate(0, itemDetails = $$props.itemDetails);
    		if ("itemNr" in $$props) $$invalidate(1, itemNr = $$props.itemNr);
    		if ("lastSorted" in $$props) lastSorted = $$props.lastSorted;
    		if ("sortingDirection" in $$props) $$invalidate(2, sortingDirection = $$props.sortingDirection);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		itemDetails,
    		itemNr,
    		sortingDirection,
    		$entries,
    		showDetail,
    		sorting,
    		detailClosed,
    		lastSorted,
    		sortAsBefore,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		input_change_handler,
    		click_handler_7
    	];
    }

    class BookList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BookList",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.21.0 */

    function create_fragment$7(ctx) {
    	let t;
    	let current;
    	const tailwindcss = new Tailwindcss({ $$inline: true });

    	const router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tailwindcss.$$.fragment);
    			t = space();
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(tailwindcss, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tailwindcss.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tailwindcss.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tailwindcss, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	const routes = {
    		"/": Home,
    		"/AddEntry": AddEntry,
    		"/BookList": BookList
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Tailwindcss,
    		Home,
    		AddEntry,
    		BookList,
    		Router,
    		routes
    	});

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
