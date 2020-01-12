
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
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
            ? instance(component, prop_values, (i, ret, value = ret) => {
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
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
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
        document.dispatchEvent(custom_event(type, detail));
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
    }

    /* src/components/Heading.svelte generated by Svelte v3.16.7 */

    const file = "src/components/Heading.svelte";

    // (73:23) 
    function create_if_block_5(ctx) {
    	let h6;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			h6 = element("h6");
    			if (default_slot) default_slot.c();
    			attr_dev(h6, "class", "svelte-1ry5z6g");
    			toggle_class(h6, "lineHeightReset", /*lineHeightReset*/ ctx[2]);
    			toggle_class(h6, "noMargin", /*noMargin*/ ctx[1]);
    			add_location(h6, file, 73, 2, 1402);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h6, anchor);

    			if (default_slot) {
    				default_slot.m(h6, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    			}

    			if (dirty & /*lineHeightReset*/ 4) {
    				toggle_class(h6, "lineHeightReset", /*lineHeightReset*/ ctx[2]);
    			}

    			if (dirty & /*noMargin*/ 2) {
    				toggle_class(h6, "noMargin", /*noMargin*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h6);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(73:23) ",
    		ctx
    	});

    	return block;
    }

    // (69:23) 
    function create_if_block_4(ctx) {
    	let h5;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			if (default_slot) default_slot.c();
    			attr_dev(h5, "class", "svelte-1ry5z6g");
    			toggle_class(h5, "lineHeightReset", /*lineHeightReset*/ ctx[2]);
    			toggle_class(h5, "noMargin", /*noMargin*/ ctx[1]);
    			add_location(h5, file, 69, 2, 1313);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);

    			if (default_slot) {
    				default_slot.m(h5, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    			}

    			if (dirty & /*lineHeightReset*/ 4) {
    				toggle_class(h5, "lineHeightReset", /*lineHeightReset*/ ctx[2]);
    			}

    			if (dirty & /*noMargin*/ 2) {
    				toggle_class(h5, "noMargin", /*noMargin*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(69:23) ",
    		ctx
    	});

    	return block;
    }

    // (65:23) 
    function create_if_block_3(ctx) {
    	let h4;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			if (default_slot) default_slot.c();
    			attr_dev(h4, "class", "svelte-1ry5z6g");
    			toggle_class(h4, "lineHeightReset", /*lineHeightReset*/ ctx[2]);
    			toggle_class(h4, "noMargin", /*noMargin*/ ctx[1]);
    			add_location(h4, file, 65, 2, 1224);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);

    			if (default_slot) {
    				default_slot.m(h4, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    			}

    			if (dirty & /*lineHeightReset*/ 4) {
    				toggle_class(h4, "lineHeightReset", /*lineHeightReset*/ ctx[2]);
    			}

    			if (dirty & /*noMargin*/ 2) {
    				toggle_class(h4, "noMargin", /*noMargin*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(65:23) ",
    		ctx
    	});

    	return block;
    }

    // (61:23) 
    function create_if_block_2(ctx) {
    	let h3;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			if (default_slot) default_slot.c();
    			attr_dev(h3, "class", "svelte-1ry5z6g");
    			toggle_class(h3, "lineHeightReset", /*lineHeightReset*/ ctx[2]);
    			toggle_class(h3, "noMargin", /*noMargin*/ ctx[1]);
    			add_location(h3, file, 61, 2, 1135);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);

    			if (default_slot) {
    				default_slot.m(h3, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    			}

    			if (dirty & /*lineHeightReset*/ 4) {
    				toggle_class(h3, "lineHeightReset", /*lineHeightReset*/ ctx[2]);
    			}

    			if (dirty & /*noMargin*/ 2) {
    				toggle_class(h3, "noMargin", /*noMargin*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(61:23) ",
    		ctx
    	});

    	return block;
    }

    // (57:23) 
    function create_if_block_1(ctx) {
    	let h2;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			if (default_slot) default_slot.c();
    			attr_dev(h2, "class", "svelte-1ry5z6g");
    			toggle_class(h2, "lineHeightReset", /*lineHeightReset*/ ctx[2]);
    			toggle_class(h2, "noMargin", /*noMargin*/ ctx[1]);
    			add_location(h2, file, 57, 2, 1046);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);

    			if (default_slot) {
    				default_slot.m(h2, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    			}

    			if (dirty & /*lineHeightReset*/ 4) {
    				toggle_class(h2, "lineHeightReset", /*lineHeightReset*/ ctx[2]);
    			}

    			if (dirty & /*noMargin*/ 2) {
    				toggle_class(h2, "noMargin", /*noMargin*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(57:23) ",
    		ctx
    	});

    	return block;
    }

    // (53:0) {#if size === '1'}
    function create_if_block(ctx) {
    	let h1;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			if (default_slot) default_slot.c();
    			attr_dev(h1, "class", "svelte-1ry5z6g");
    			toggle_class(h1, "lineHeightReset", /*lineHeightReset*/ ctx[2]);
    			toggle_class(h1, "noMargin", /*noMargin*/ ctx[1]);
    			add_location(h1, file, 53, 2, 957);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);

    			if (default_slot) {
    				default_slot.m(h1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    			}

    			if (dirty & /*lineHeightReset*/ 4) {
    				toggle_class(h1, "lineHeightReset", /*lineHeightReset*/ ctx[2]);
    			}

    			if (dirty & /*noMargin*/ 2) {
    				toggle_class(h1, "noMargin", /*noMargin*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(53:0) {#if size === '1'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;

    	const if_block_creators = [
    		create_if_block,
    		create_if_block_1,
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4,
    		create_if_block_5
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*size*/ ctx[0] === "1") return 0;
    		if (/*size*/ ctx[0] === "2") return 1;
    		if (/*size*/ ctx[0] === "3") return 2;
    		if (/*size*/ ctx[0] === "4") return 3;
    		if (/*size*/ ctx[0] === "5") return 4;
    		if (/*size*/ ctx[0] === "6") return 5;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
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
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
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

    function instance($$self, $$props, $$invalidate) {
    	let { size } = $$props;
    	let { noMargin } = $$props;
    	let { lineHeightReset } = $$props;
    	const writable_props = ["size", "noMargin", "lineHeightReset"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Heading> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("noMargin" in $$props) $$invalidate(1, noMargin = $$props.noMargin);
    		if ("lineHeightReset" in $$props) $$invalidate(2, lineHeightReset = $$props.lineHeightReset);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { size, noMargin, lineHeightReset };
    	};

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("noMargin" in $$props) $$invalidate(1, noMargin = $$props.noMargin);
    		if ("lineHeightReset" in $$props) $$invalidate(2, lineHeightReset = $$props.lineHeightReset);
    	};

    	return [size, noMargin, lineHeightReset, $$scope, $$slots];
    }

    class Heading extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { size: 0, noMargin: 1, lineHeightReset: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Heading",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*size*/ ctx[0] === undefined && !("size" in props)) {
    			console.warn("<Heading> was created without expected prop 'size'");
    		}

    		if (/*noMargin*/ ctx[1] === undefined && !("noMargin" in props)) {
    			console.warn("<Heading> was created without expected prop 'noMargin'");
    		}

    		if (/*lineHeightReset*/ ctx[2] === undefined && !("lineHeightReset" in props)) {
    			console.warn("<Heading> was created without expected prop 'lineHeightReset'");
    		}
    	}

    	get size() {
    		throw new Error("<Heading>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Heading>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noMargin() {
    		throw new Error("<Heading>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noMargin(value) {
    		throw new Error("<Heading>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineHeightReset() {
    		throw new Error("<Heading>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineHeightReset(value) {
    		throw new Error("<Heading>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Button.svelte generated by Svelte v3.16.7 */

    const file$1 = "src/components/Button.svelte";

    function create_fragment$1(ctx) {
    	let button;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "class", "svelte-tp3y8f");
    			toggle_class(button, "buttonEsc", /*buttonEsc*/ ctx[0]);
    			toggle_class(button, "primary", /*primary*/ ctx[1]);
    			toggle_class(button, "secondary", /*secondary*/ ctx[2]);
    			toggle_class(button, "warning", /*warning*/ ctx[3]);
    			toggle_class(button, "rounded", /*rounded*/ ctx[4]);
    			add_location(button, file$1, 57, 0, 1010);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 32) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[5], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null));
    			}

    			if (dirty & /*buttonEsc*/ 1) {
    				toggle_class(button, "buttonEsc", /*buttonEsc*/ ctx[0]);
    			}

    			if (dirty & /*primary*/ 2) {
    				toggle_class(button, "primary", /*primary*/ ctx[1]);
    			}

    			if (dirty & /*secondary*/ 4) {
    				toggle_class(button, "secondary", /*secondary*/ ctx[2]);
    			}

    			if (dirty & /*warning*/ 8) {
    				toggle_class(button, "warning", /*warning*/ ctx[3]);
    			}

    			if (dirty & /*rounded*/ 16) {
    				toggle_class(button, "rounded", /*rounded*/ ctx[4]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { buttonEsc = false } = $$props;
    	let { primary = false } = $$props;
    	let { secondary = false } = $$props;
    	let { warning = false } = $$props;
    	let { rounded = false } = $$props;
    	const writable_props = ["buttonEsc", "primary", "secondary", "warning", "rounded"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("buttonEsc" in $$props) $$invalidate(0, buttonEsc = $$props.buttonEsc);
    		if ("primary" in $$props) $$invalidate(1, primary = $$props.primary);
    		if ("secondary" in $$props) $$invalidate(2, secondary = $$props.secondary);
    		if ("warning" in $$props) $$invalidate(3, warning = $$props.warning);
    		if ("rounded" in $$props) $$invalidate(4, rounded = $$props.rounded);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			buttonEsc,
    			primary,
    			secondary,
    			warning,
    			rounded
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("buttonEsc" in $$props) $$invalidate(0, buttonEsc = $$props.buttonEsc);
    		if ("primary" in $$props) $$invalidate(1, primary = $$props.primary);
    		if ("secondary" in $$props) $$invalidate(2, secondary = $$props.secondary);
    		if ("warning" in $$props) $$invalidate(3, warning = $$props.warning);
    		if ("rounded" in $$props) $$invalidate(4, rounded = $$props.rounded);
    	};

    	return [buttonEsc, primary, secondary, warning, rounded, $$scope, $$slots];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			buttonEsc: 0,
    			primary: 1,
    			secondary: 2,
    			warning: 3,
    			rounded: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get buttonEsc() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set buttonEsc(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get primary() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primary(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondary() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondary(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get warning() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set warning(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rounded() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rounded(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/ButtonGroup.svelte generated by Svelte v3.16.7 */

    const file$2 = "src/components/ButtonGroup.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_style(div, "--column-count", /*col*/ ctx[2]);
    			attr_dev(div, "class", "svelte-1ix2e7d");
    			toggle_class(div, "buttonGroupEsc", /*buttonGroupEsc*/ ctx[0]);
    			toggle_class(div, "isRightAligned", /*isRightAligned*/ ctx[1]);
    			add_location(div, file$2, 19, 0, 382);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    			}

    			if (!current || dirty & /*col*/ 4) {
    				set_style(div, "--column-count", /*col*/ ctx[2]);
    			}

    			if (dirty & /*buttonGroupEsc*/ 1) {
    				toggle_class(div, "buttonGroupEsc", /*buttonGroupEsc*/ ctx[0]);
    			}

    			if (dirty & /*isRightAligned*/ 2) {
    				toggle_class(div, "isRightAligned", /*isRightAligned*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { buttonGroupEsc = false } = $$props;
    	let { isRightAligned = false } = $$props;
    	let { col = 1 } = $$props;
    	const writable_props = ["buttonGroupEsc", "isRightAligned", "col"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ButtonGroup> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("buttonGroupEsc" in $$props) $$invalidate(0, buttonGroupEsc = $$props.buttonGroupEsc);
    		if ("isRightAligned" in $$props) $$invalidate(1, isRightAligned = $$props.isRightAligned);
    		if ("col" in $$props) $$invalidate(2, col = $$props.col);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { buttonGroupEsc, isRightAligned, col };
    	};

    	$$self.$inject_state = $$props => {
    		if ("buttonGroupEsc" in $$props) $$invalidate(0, buttonGroupEsc = $$props.buttonGroupEsc);
    		if ("isRightAligned" in $$props) $$invalidate(1, isRightAligned = $$props.isRightAligned);
    		if ("col" in $$props) $$invalidate(2, col = $$props.col);
    	};

    	return [buttonGroupEsc, isRightAligned, col, $$scope, $$slots];
    }

    class ButtonGroup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			buttonGroupEsc: 0,
    			isRightAligned: 1,
    			col: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ButtonGroup",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get buttonGroupEsc() {
    		throw new Error("<ButtonGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set buttonGroupEsc(value) {
    		throw new Error("<ButtonGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isRightAligned() {
    		throw new Error("<ButtonGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isRightAligned(value) {
    		throw new Error("<ButtonGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get col() {
    		throw new Error("<ButtonGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set col(value) {
    		throw new Error("<ButtonGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Container.svelte generated by Svelte v3.16.7 */

    const file$3 = "src/components/Container.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-1vp9qky");
    			toggle_class(div, "containerEsc", /*containerEsc*/ ctx[0]);
    			toggle_class(div, "center", /*center*/ ctx[1]);
    			toggle_class(div, "fluid", /*fluid*/ ctx[2]);
    			toggle_class(div, "small", /*small*/ ctx[3]);
    			toggle_class(div, "medium", /*medium*/ ctx[4]);
    			toggle_class(div, "large", /*large*/ ctx[5]);
    			add_location(div, file$3, 41, 0, 577);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 64) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[6], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null));
    			}

    			if (dirty & /*containerEsc*/ 1) {
    				toggle_class(div, "containerEsc", /*containerEsc*/ ctx[0]);
    			}

    			if (dirty & /*center*/ 2) {
    				toggle_class(div, "center", /*center*/ ctx[1]);
    			}

    			if (dirty & /*fluid*/ 4) {
    				toggle_class(div, "fluid", /*fluid*/ ctx[2]);
    			}

    			if (dirty & /*small*/ 8) {
    				toggle_class(div, "small", /*small*/ ctx[3]);
    			}

    			if (dirty & /*medium*/ 16) {
    				toggle_class(div, "medium", /*medium*/ ctx[4]);
    			}

    			if (dirty & /*large*/ 32) {
    				toggle_class(div, "large", /*large*/ ctx[5]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
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
    	let { containerEsc = false } = $$props;
    	let { center = false } = $$props;
    	let { fluid = false } = $$props;
    	let { small = false } = $$props;
    	let { medium = false } = $$props;
    	let { large = false } = $$props;
    	const writable_props = ["containerEsc", "center", "fluid", "small", "medium", "large"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Container> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("containerEsc" in $$props) $$invalidate(0, containerEsc = $$props.containerEsc);
    		if ("center" in $$props) $$invalidate(1, center = $$props.center);
    		if ("fluid" in $$props) $$invalidate(2, fluid = $$props.fluid);
    		if ("small" in $$props) $$invalidate(3, small = $$props.small);
    		if ("medium" in $$props) $$invalidate(4, medium = $$props.medium);
    		if ("large" in $$props) $$invalidate(5, large = $$props.large);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			containerEsc,
    			center,
    			fluid,
    			small,
    			medium,
    			large
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("containerEsc" in $$props) $$invalidate(0, containerEsc = $$props.containerEsc);
    		if ("center" in $$props) $$invalidate(1, center = $$props.center);
    		if ("fluid" in $$props) $$invalidate(2, fluid = $$props.fluid);
    		if ("small" in $$props) $$invalidate(3, small = $$props.small);
    		if ("medium" in $$props) $$invalidate(4, medium = $$props.medium);
    		if ("large" in $$props) $$invalidate(5, large = $$props.large);
    	};

    	return [containerEsc, center, fluid, small, medium, large, $$scope, $$slots];
    }

    class Container extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			containerEsc: 0,
    			center: 1,
    			fluid: 2,
    			small: 3,
    			medium: 4,
    			large: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Container",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get containerEsc() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set containerEsc(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get center() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set center(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fluid() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fluid(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get small() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set small(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get medium() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set medium(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get large() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set large(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Paragraph.svelte generated by Svelte v3.16.7 */

    const file$4 = "src/components/Paragraph.svelte";

    function create_fragment$4(ctx) {
    	let p;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			p = element("p");
    			if (default_slot) default_slot.c();
    			attr_dev(p, "class", "svelte-1hs8fa8");
    			toggle_class(p, "small", /*small*/ ctx[0]);
    			toggle_class(p, "tiny", /*tiny*/ ctx[1]);
    			add_location(p, file$4, 21, 0, 364);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);

    			if (default_slot) {
    				default_slot.m(p, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 4) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[2], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null));
    			}

    			if (dirty & /*small*/ 1) {
    				toggle_class(p, "small", /*small*/ ctx[0]);
    			}

    			if (dirty & /*tiny*/ 2) {
    				toggle_class(p, "tiny", /*tiny*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (default_slot) default_slot.d(detaching);
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

    function instance$4($$self, $$props, $$invalidate) {
    	let { small = false } = $$props;
    	let { tiny = false } = $$props;
    	const writable_props = ["small", "tiny"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Paragraph> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("small" in $$props) $$invalidate(0, small = $$props.small);
    		if ("tiny" in $$props) $$invalidate(1, tiny = $$props.tiny);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { small, tiny };
    	};

    	$$self.$inject_state = $$props => {
    		if ("small" in $$props) $$invalidate(0, small = $$props.small);
    		if ("tiny" in $$props) $$invalidate(1, tiny = $$props.tiny);
    	};

    	return [small, tiny, $$scope, $$slots];
    }

    class Paragraph extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { small: 0, tiny: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Paragraph",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get small() {
    		throw new Error("<Paragraph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set small(value) {
    		throw new Error("<Paragraph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tiny() {
    		throw new Error("<Paragraph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tiny(value) {
    		throw new Error("<Paragraph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pageTemplates/Examples.svelte generated by Svelte v3.16.7 */

    // (14:2) <Heading size="1">
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*title*/ ctx[0]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 1) set_data_dev(t, /*title*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(14:2) <Heading size=\\\"1\\\">",
    		ctx
    	});

    	return block;
    }

    // (15:2) <Paragraph small>
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*introduction*/ ctx[1]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*introduction*/ 2) set_data_dev(t, /*introduction*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(15:2) <Paragraph small>",
    		ctx
    	});

    	return block;
    }

    // (13:0) <Container center small>
    function create_default_slot(ctx) {
    	let t0;
    	let t1;
    	let current;

    	const heading = new Heading({
    			props: {
    				size: "1",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const paragraph = new Paragraph({
    			props: {
    				small: true,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const default_slot_template = /*$$slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			create_component(heading.$$.fragment);
    			t0 = space();
    			create_component(paragraph.$$.fragment);
    			t1 = space();
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			mount_component(heading, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(paragraph, target, anchor);
    			insert_dev(target, t1, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const heading_changes = {};

    			if (dirty & /*$$scope, title*/ 9) {
    				heading_changes.$$scope = { dirty, ctx };
    			}

    			heading.$set(heading_changes);
    			const paragraph_changes = {};

    			if (dirty & /*$$scope, introduction*/ 10) {
    				paragraph_changes.$$scope = { dirty, ctx };
    			}

    			paragraph.$set(paragraph_changes);

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(heading.$$.fragment, local);
    			transition_in(paragraph.$$.fragment, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(heading.$$.fragment, local);
    			transition_out(paragraph.$$.fragment, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(heading, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(paragraph, detaching);
    			if (detaching) detach_dev(t1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(13:0) <Container center small>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current;

    	const container = new Container({
    			props: {
    				center: true,
    				small: true,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(container.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(container, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const container_changes = {};

    			if (dirty & /*$$scope, introduction, title*/ 11) {
    				container_changes.$$scope = { dirty, ctx };
    			}

    			container.$set(container_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(container.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(container.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(container, detaching);
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
    	let { title } = $$props;
    	let { introduction } = $$props;
    	const writable_props = ["title", "introduction"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Examples> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("introduction" in $$props) $$invalidate(1, introduction = $$props.introduction);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { title, introduction };
    	};

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("introduction" in $$props) $$invalidate(1, introduction = $$props.introduction);
    	};

    	return [title, introduction, $$slots, $$scope];
    }

    class Examples extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { title: 0, introduction: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Examples",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<Examples> was created without expected prop 'title'");
    		}

    		if (/*introduction*/ ctx[1] === undefined && !("introduction" in props)) {
    			console.warn("<Examples> was created without expected prop 'introduction'");
    		}
    	}

    	get title() {
    		throw new Error("<Examples>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Examples>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get introduction() {
    		throw new Error("<Examples>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set introduction(value) {
    		throw new Error("<Examples>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Card.svelte generated by Svelte v3.16.7 */

    const file$5 = "src/components/Card.svelte";
    const get_footer_slot_changes = dirty => ({});
    const get_footer_slot_context = ctx => ({});
    const get_header_slot_changes = dirty => ({});
    const get_header_slot_context = ctx => ({});

    function create_fragment$6(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let current;
    	const header_slot_template = /*$$slots*/ ctx[4].header;
    	const header_slot = create_slot(header_slot_template, ctx, /*$$scope*/ ctx[3], get_header_slot_context);
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	const footer_slot_template = /*$$slots*/ ctx[4].footer;
    	const footer_slot = create_slot(footer_slot_template, ctx, /*$$scope*/ ctx[3], get_footer_slot_context);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (header_slot) header_slot.c();
    			t0 = space();
    			if (default_slot) default_slot.c();
    			t1 = space();
    			if (footer_slot) footer_slot.c();
    			attr_dev(div, "class", "svelte-2wg77k");
    			toggle_class(div, "cardEsc", /*cardEsc*/ ctx[0]);
    			toggle_class(div, "hasFooter", /*hasFooter*/ ctx[1]);
    			toggle_class(div, "isTransparent", /*isTransparent*/ ctx[2]);
    			add_location(div, file$5, 34, 0, 917);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (header_slot) {
    				header_slot.m(div, null);
    			}

    			append_dev(div, t0);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(div, t1);

    			if (footer_slot) {
    				footer_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (header_slot && header_slot.p && dirty & /*$$scope*/ 8) {
    				header_slot.p(get_slot_context(header_slot_template, ctx, /*$$scope*/ ctx[3], get_header_slot_context), get_slot_changes(header_slot_template, /*$$scope*/ ctx[3], dirty, get_header_slot_changes));
    			}

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    			}

    			if (footer_slot && footer_slot.p && dirty & /*$$scope*/ 8) {
    				footer_slot.p(get_slot_context(footer_slot_template, ctx, /*$$scope*/ ctx[3], get_footer_slot_context), get_slot_changes(footer_slot_template, /*$$scope*/ ctx[3], dirty, get_footer_slot_changes));
    			}

    			if (dirty & /*cardEsc*/ 1) {
    				toggle_class(div, "cardEsc", /*cardEsc*/ ctx[0]);
    			}

    			if (dirty & /*hasFooter*/ 2) {
    				toggle_class(div, "hasFooter", /*hasFooter*/ ctx[1]);
    			}

    			if (dirty & /*isTransparent*/ 4) {
    				toggle_class(div, "isTransparent", /*isTransparent*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header_slot, local);
    			transition_in(default_slot, local);
    			transition_in(footer_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header_slot, local);
    			transition_out(default_slot, local);
    			transition_out(footer_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (header_slot) header_slot.d(detaching);
    			if (default_slot) default_slot.d(detaching);
    			if (footer_slot) footer_slot.d(detaching);
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

    function instance$6($$self, $$props, $$invalidate) {
    	let { cardEsc = false } = $$props;
    	let { hasFooter = false } = $$props;
    	let { isTransparent = false } = $$props;
    	const writable_props = ["cardEsc", "hasFooter", "isTransparent"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("cardEsc" in $$props) $$invalidate(0, cardEsc = $$props.cardEsc);
    		if ("hasFooter" in $$props) $$invalidate(1, hasFooter = $$props.hasFooter);
    		if ("isTransparent" in $$props) $$invalidate(2, isTransparent = $$props.isTransparent);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { cardEsc, hasFooter, isTransparent };
    	};

    	$$self.$inject_state = $$props => {
    		if ("cardEsc" in $$props) $$invalidate(0, cardEsc = $$props.cardEsc);
    		if ("hasFooter" in $$props) $$invalidate(1, hasFooter = $$props.hasFooter);
    		if ("isTransparent" in $$props) $$invalidate(2, isTransparent = $$props.isTransparent);
    	};

    	return [cardEsc, hasFooter, isTransparent, $$scope, $$slots];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			cardEsc: 0,
    			hasFooter: 1,
    			isTransparent: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get cardEsc() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cardEsc(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hasFooter() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hasFooter(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isTransparent() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isTransparent(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Code.svelte generated by Svelte v3.16.7 */

    const file$6 = "src/components/Code.svelte";

    function create_fragment$7(ctx) {
    	let code;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			code = element("code");
    			if (default_slot) default_slot.c();
    			attr_dev(code, "class", "svelte-17wh0w");
    			toggle_class(code, "codeEsc", /*codeEsc*/ ctx[0]);
    			add_location(code, file$6, 16, 0, 344);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, code, anchor);

    			if (default_slot) {
    				default_slot.m(code, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 2) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[1], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null));
    			}

    			if (dirty & /*codeEsc*/ 1) {
    				toggle_class(code, "codeEsc", /*codeEsc*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(code);
    			if (default_slot) default_slot.d(detaching);
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
    	let { codeEsc = false } = $$props;
    	const writable_props = ["codeEsc"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Code> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("codeEsc" in $$props) $$invalidate(0, codeEsc = $$props.codeEsc);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { codeEsc };
    	};

    	$$self.$inject_state = $$props => {
    		if ("codeEsc" in $$props) $$invalidate(0, codeEsc = $$props.codeEsc);
    	};

    	return [codeEsc, $$scope, $$slots];
    }

    class Code extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { codeEsc: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Code",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get codeEsc() {
    		throw new Error("<Code>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set codeEsc(value) {
    		throw new Error("<Code>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.7 */
    const file$7 = "src/App.svelte";

    // (31:4) <Heading size="1">
    function create_default_slot_49(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_49.name,
    		type: "slot",
    		source: "(31:4) <Heading size=\\\"1\\\">",
    		ctx
    	});

    	return block;
    }

    // (32:4) <Heading size="2">
    function create_default_slot_48(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_48.name,
    		type: "slot",
    		source: "(32:4) <Heading size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (33:4) <Heading size="3">
    function create_default_slot_47(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_47.name,
    		type: "slot",
    		source: "(33:4) <Heading size=\\\"3\\\">",
    		ctx
    	});

    	return block;
    }

    // (34:4) <Heading size="4">
    function create_default_slot_46(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_46.name,
    		type: "slot",
    		source: "(34:4) <Heading size=\\\"4\\\">",
    		ctx
    	});

    	return block;
    }

    // (35:4) <Heading size="5">
    function create_default_slot_45(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_45.name,
    		type: "slot",
    		source: "(35:4) <Heading size=\\\"5\\\">",
    		ctx
    	});

    	return block;
    }

    // (36:4) <Heading size="6">
    function create_default_slot_44(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_44.name,
    		type: "slot",
    		source: "(36:4) <Heading size=\\\"6\\\">",
    		ctx
    	});

    	return block;
    }

    // (37:4) <Code codeEsc>
    function create_default_slot_43(ctx) {
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let br2;
    	let t3;
    	let br3;
    	let t4;
    	let br4;
    	let t5;

    	const block = {
    		c: function create() {
    			t0 = text("<Heading size=\"1\">Title</Heading>\n      ");
    			br0 = element("br");
    			t1 = text("\n      <Heading size=\"2\">Title</Heading>\n      ");
    			br1 = element("br");
    			t2 = text("\n      <Heading size=\"3\">Title</Heading>\n      ");
    			br2 = element("br");
    			t3 = text("\n      <Heading size=\"4\">Title</Heading>\n      ");
    			br3 = element("br");
    			t4 = text("\n      <Heading size=\"5\">Title</Heading>\n      ");
    			br4 = element("br");
    			t5 = text("\n      <Heading size=\"6\">Title</Heading>");
    			attr_dev(br0, "class", "svelte-1nw7k6q");
    			add_location(br0, file$7, 38, 6, 1376);
    			attr_dev(br1, "class", "svelte-1nw7k6q");
    			add_location(br1, file$7, 40, 6, 1441);
    			attr_dev(br2, "class", "svelte-1nw7k6q");
    			add_location(br2, file$7, 42, 6, 1506);
    			attr_dev(br3, "class", "svelte-1nw7k6q");
    			add_location(br3, file$7, 44, 6, 1571);
    			attr_dev(br4, "class", "svelte-1nw7k6q");
    			add_location(br4, file$7, 46, 6, 1636);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, br4, anchor);
    			insert_dev(target, t5, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(br4);
    			if (detaching) detach_dev(t5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_43.name,
    		type: "slot",
    		source: "(37:4) <Code codeEsc>",
    		ctx
    	});

    	return block;
    }

    // (30:2) <Card cardEsc hasFooter>
    function create_default_slot_42(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let current;

    	const heading0 = new Heading({
    			props: {
    				size: "1",
    				$$slots: { default: [create_default_slot_49] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const heading1 = new Heading({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_48] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const heading2 = new Heading({
    			props: {
    				size: "3",
    				$$slots: { default: [create_default_slot_47] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const heading3 = new Heading({
    			props: {
    				size: "4",
    				$$slots: { default: [create_default_slot_46] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const heading4 = new Heading({
    			props: {
    				size: "5",
    				$$slots: { default: [create_default_slot_45] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const heading5 = new Heading({
    			props: {
    				size: "6",
    				$$slots: { default: [create_default_slot_44] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const code = new Code({
    			props: {
    				codeEsc: true,
    				$$slots: { default: [create_default_slot_43] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(heading0.$$.fragment);
    			t0 = space();
    			create_component(heading1.$$.fragment);
    			t1 = space();
    			create_component(heading2.$$.fragment);
    			t2 = space();
    			create_component(heading3.$$.fragment);
    			t3 = space();
    			create_component(heading4.$$.fragment);
    			t4 = space();
    			create_component(heading5.$$.fragment);
    			t5 = space();
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(heading0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(heading1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(heading2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(heading3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(heading4, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(heading5, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const heading0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading0_changes.$$scope = { dirty, ctx };
    			}

    			heading0.$set(heading0_changes);
    			const heading1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading1_changes.$$scope = { dirty, ctx };
    			}

    			heading1.$set(heading1_changes);
    			const heading2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading2_changes.$$scope = { dirty, ctx };
    			}

    			heading2.$set(heading2_changes);
    			const heading3_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading3_changes.$$scope = { dirty, ctx };
    			}

    			heading3.$set(heading3_changes);
    			const heading4_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading4_changes.$$scope = { dirty, ctx };
    			}

    			heading4.$set(heading4_changes);
    			const heading5_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading5_changes.$$scope = { dirty, ctx };
    			}

    			heading5.$set(heading5_changes);
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(heading0.$$.fragment, local);
    			transition_in(heading1.$$.fragment, local);
    			transition_in(heading2.$$.fragment, local);
    			transition_in(heading3.$$.fragment, local);
    			transition_in(heading4.$$.fragment, local);
    			transition_in(heading5.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(heading0.$$.fragment, local);
    			transition_out(heading1.$$.fragment, local);
    			transition_out(heading2.$$.fragment, local);
    			transition_out(heading3.$$.fragment, local);
    			transition_out(heading4.$$.fragment, local);
    			transition_out(heading5.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(heading0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(heading1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(heading2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(heading3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(heading4, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(heading5, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_42.name,
    		type: "slot",
    		source: "(30:2) <Card cardEsc hasFooter>",
    		ctx
    	});

    	return block;
    }

    // (52:4) <Heading size="1" noMargin>
    function create_default_slot_41(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_41.name,
    		type: "slot",
    		source: "(52:4) <Heading size=\\\"1\\\" noMargin>",
    		ctx
    	});

    	return block;
    }

    // (53:4) <Heading size="2" noMargin>
    function create_default_slot_40(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_40.name,
    		type: "slot",
    		source: "(53:4) <Heading size=\\\"2\\\" noMargin>",
    		ctx
    	});

    	return block;
    }

    // (54:4) <Heading size="3" noMargin>
    function create_default_slot_39(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_39.name,
    		type: "slot",
    		source: "(54:4) <Heading size=\\\"3\\\" noMargin>",
    		ctx
    	});

    	return block;
    }

    // (55:4) <Heading size="4" noMargin>
    function create_default_slot_38(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_38.name,
    		type: "slot",
    		source: "(55:4) <Heading size=\\\"4\\\" noMargin>",
    		ctx
    	});

    	return block;
    }

    // (56:4) <Heading size="5" noMargin>
    function create_default_slot_37(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_37.name,
    		type: "slot",
    		source: "(56:4) <Heading size=\\\"5\\\" noMargin>",
    		ctx
    	});

    	return block;
    }

    // (57:4) <Heading size="6" noMargin>
    function create_default_slot_36(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_36.name,
    		type: "slot",
    		source: "(57:4) <Heading size=\\\"6\\\" noMargin>",
    		ctx
    	});

    	return block;
    }

    // (58:4) <Code codeEsc>
    function create_default_slot_35(ctx) {
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let br2;
    	let t3;
    	let br3;
    	let t4;
    	let br4;
    	let t5;

    	const block = {
    		c: function create() {
    			t0 = text("<Heading size=\"1\" noMargin>Title</Heading>\n      ");
    			br0 = element("br");
    			t1 = text("\n      <Heading size=\"2\" noMargin>Title</Heading>\n      ");
    			br1 = element("br");
    			t2 = text("\n      <Heading size=\"3\" noMargin>Title</Heading>\n      ");
    			br2 = element("br");
    			t3 = text("\n      <Heading size=\"4\" noMargin>Title</Heading>\n      ");
    			br3 = element("br");
    			t4 = text("\n      <Heading size=\"5\" noMargin>Title</Heading>\n      ");
    			br4 = element("br");
    			t5 = text("\n      <Heading size=\"6\" noMargin>Title</Heading>");
    			attr_dev(br0, "class", "svelte-1nw7k6q");
    			add_location(br0, file$7, 59, 6, 2112);
    			attr_dev(br1, "class", "svelte-1nw7k6q");
    			add_location(br1, file$7, 61, 6, 2186);
    			attr_dev(br2, "class", "svelte-1nw7k6q");
    			add_location(br2, file$7, 63, 6, 2260);
    			attr_dev(br3, "class", "svelte-1nw7k6q");
    			add_location(br3, file$7, 65, 6, 2334);
    			attr_dev(br4, "class", "svelte-1nw7k6q");
    			add_location(br4, file$7, 67, 6, 2408);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, br4, anchor);
    			insert_dev(target, t5, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(br4);
    			if (detaching) detach_dev(t5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_35.name,
    		type: "slot",
    		source: "(58:4) <Code codeEsc>",
    		ctx
    	});

    	return block;
    }

    // (51:2) <Card cardEsc hasFooter>
    function create_default_slot_34(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let current;

    	const heading0 = new Heading({
    			props: {
    				size: "1",
    				noMargin: true,
    				$$slots: { default: [create_default_slot_41] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const heading1 = new Heading({
    			props: {
    				size: "2",
    				noMargin: true,
    				$$slots: { default: [create_default_slot_40] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const heading2 = new Heading({
    			props: {
    				size: "3",
    				noMargin: true,
    				$$slots: { default: [create_default_slot_39] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const heading3 = new Heading({
    			props: {
    				size: "4",
    				noMargin: true,
    				$$slots: { default: [create_default_slot_38] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const heading4 = new Heading({
    			props: {
    				size: "5",
    				noMargin: true,
    				$$slots: { default: [create_default_slot_37] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const heading5 = new Heading({
    			props: {
    				size: "6",
    				noMargin: true,
    				$$slots: { default: [create_default_slot_36] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const code = new Code({
    			props: {
    				codeEsc: true,
    				$$slots: { default: [create_default_slot_35] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(heading0.$$.fragment);
    			t0 = space();
    			create_component(heading1.$$.fragment);
    			t1 = space();
    			create_component(heading2.$$.fragment);
    			t2 = space();
    			create_component(heading3.$$.fragment);
    			t3 = space();
    			create_component(heading4.$$.fragment);
    			t4 = space();
    			create_component(heading5.$$.fragment);
    			t5 = space();
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(heading0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(heading1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(heading2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(heading3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(heading4, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(heading5, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const heading0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading0_changes.$$scope = { dirty, ctx };
    			}

    			heading0.$set(heading0_changes);
    			const heading1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading1_changes.$$scope = { dirty, ctx };
    			}

    			heading1.$set(heading1_changes);
    			const heading2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading2_changes.$$scope = { dirty, ctx };
    			}

    			heading2.$set(heading2_changes);
    			const heading3_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading3_changes.$$scope = { dirty, ctx };
    			}

    			heading3.$set(heading3_changes);
    			const heading4_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading4_changes.$$scope = { dirty, ctx };
    			}

    			heading4.$set(heading4_changes);
    			const heading5_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading5_changes.$$scope = { dirty, ctx };
    			}

    			heading5.$set(heading5_changes);
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(heading0.$$.fragment, local);
    			transition_in(heading1.$$.fragment, local);
    			transition_in(heading2.$$.fragment, local);
    			transition_in(heading3.$$.fragment, local);
    			transition_in(heading4.$$.fragment, local);
    			transition_in(heading5.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(heading0.$$.fragment, local);
    			transition_out(heading1.$$.fragment, local);
    			transition_out(heading2.$$.fragment, local);
    			transition_out(heading3.$$.fragment, local);
    			transition_out(heading4.$$.fragment, local);
    			transition_out(heading5.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(heading0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(heading1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(heading2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(heading3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(heading4, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(heading5, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_34.name,
    		type: "slot",
    		source: "(51:2) <Card cardEsc hasFooter>",
    		ctx
    	});

    	return block;
    }

    // (73:4) <Heading size="1" noMargin lineHeightReset>
    function create_default_slot_33(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_33.name,
    		type: "slot",
    		source: "(73:4) <Heading size=\\\"1\\\" noMargin lineHeightReset>",
    		ctx
    	});

    	return block;
    }

    // (74:4) <Heading size="2" noMargin lineHeightReset>
    function create_default_slot_32(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_32.name,
    		type: "slot",
    		source: "(74:4) <Heading size=\\\"2\\\" noMargin lineHeightReset>",
    		ctx
    	});

    	return block;
    }

    // (75:4) <Heading size="3" noMargin lineHeightReset>
    function create_default_slot_31(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_31.name,
    		type: "slot",
    		source: "(75:4) <Heading size=\\\"3\\\" noMargin lineHeightReset>",
    		ctx
    	});

    	return block;
    }

    // (76:4) <Heading size="4" noMargin lineHeightReset>
    function create_default_slot_30(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_30.name,
    		type: "slot",
    		source: "(76:4) <Heading size=\\\"4\\\" noMargin lineHeightReset>",
    		ctx
    	});

    	return block;
    }

    // (77:4) <Heading size="5" noMargin lineHeightReset>
    function create_default_slot_29(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_29.name,
    		type: "slot",
    		source: "(77:4) <Heading size=\\\"5\\\" noMargin lineHeightReset>",
    		ctx
    	});

    	return block;
    }

    // (78:4) <Heading size="6" noMargin lineHeightReset>
    function create_default_slot_28(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_28.name,
    		type: "slot",
    		source: "(78:4) <Heading size=\\\"6\\\" noMargin lineHeightReset>",
    		ctx
    	});

    	return block;
    }

    // (79:4) <Code codeEsc>
    function create_default_slot_27(ctx) {
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let br2;
    	let t3;
    	let br3;
    	let t4;
    	let br4;
    	let t5;

    	const block = {
    		c: function create() {
    			t0 = text("<Heading size=\"1\" noMargin lineHeightReset>Title</Heading>\n      ");
    			br0 = element("br");
    			t1 = text("\n      <Heading size=\"2\" noMargin lineHeightReset>Title</Heading>\n      ");
    			br1 = element("br");
    			t2 = text("\n      <Heading size=\"3\" noMargin lineHeightReset>Title</Heading>\n      ");
    			br2 = element("br");
    			t3 = text("\n      <Heading size=\"4\" noMargin lineHeightReset>Title</Heading>\n      ");
    			br3 = element("br");
    			t4 = text("\n      <Heading size=\"5\" noMargin lineHeightReset>Title</Heading>\n      ");
    			br4 = element("br");
    			t5 = text("\n      <Heading size=\"6\" noMargin lineHeightReset>Title</Heading>");
    			attr_dev(br0, "class", "svelte-1nw7k6q");
    			add_location(br0, file$7, 80, 6, 3005);
    			attr_dev(br1, "class", "svelte-1nw7k6q");
    			add_location(br1, file$7, 82, 6, 3095);
    			attr_dev(br2, "class", "svelte-1nw7k6q");
    			add_location(br2, file$7, 84, 6, 3185);
    			attr_dev(br3, "class", "svelte-1nw7k6q");
    			add_location(br3, file$7, 86, 6, 3275);
    			attr_dev(br4, "class", "svelte-1nw7k6q");
    			add_location(br4, file$7, 88, 6, 3365);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, br4, anchor);
    			insert_dev(target, t5, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(br4);
    			if (detaching) detach_dev(t5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_27.name,
    		type: "slot",
    		source: "(79:4) <Code codeEsc>",
    		ctx
    	});

    	return block;
    }

    // (72:2) <Card cardEsc hasFooter>
    function create_default_slot_26(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let current;

    	const heading0 = new Heading({
    			props: {
    				size: "1",
    				noMargin: true,
    				lineHeightReset: true,
    				$$slots: { default: [create_default_slot_33] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const heading1 = new Heading({
    			props: {
    				size: "2",
    				noMargin: true,
    				lineHeightReset: true,
    				$$slots: { default: [create_default_slot_32] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const heading2 = new Heading({
    			props: {
    				size: "3",
    				noMargin: true,
    				lineHeightReset: true,
    				$$slots: { default: [create_default_slot_31] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const heading3 = new Heading({
    			props: {
    				size: "4",
    				noMargin: true,
    				lineHeightReset: true,
    				$$slots: { default: [create_default_slot_30] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const heading4 = new Heading({
    			props: {
    				size: "5",
    				noMargin: true,
    				lineHeightReset: true,
    				$$slots: { default: [create_default_slot_29] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const heading5 = new Heading({
    			props: {
    				size: "6",
    				noMargin: true,
    				lineHeightReset: true,
    				$$slots: { default: [create_default_slot_28] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const code = new Code({
    			props: {
    				codeEsc: true,
    				$$slots: { default: [create_default_slot_27] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(heading0.$$.fragment);
    			t0 = space();
    			create_component(heading1.$$.fragment);
    			t1 = space();
    			create_component(heading2.$$.fragment);
    			t2 = space();
    			create_component(heading3.$$.fragment);
    			t3 = space();
    			create_component(heading4.$$.fragment);
    			t4 = space();
    			create_component(heading5.$$.fragment);
    			t5 = space();
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(heading0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(heading1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(heading2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(heading3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(heading4, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(heading5, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const heading0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading0_changes.$$scope = { dirty, ctx };
    			}

    			heading0.$set(heading0_changes);
    			const heading1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading1_changes.$$scope = { dirty, ctx };
    			}

    			heading1.$set(heading1_changes);
    			const heading2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading2_changes.$$scope = { dirty, ctx };
    			}

    			heading2.$set(heading2_changes);
    			const heading3_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading3_changes.$$scope = { dirty, ctx };
    			}

    			heading3.$set(heading3_changes);
    			const heading4_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading4_changes.$$scope = { dirty, ctx };
    			}

    			heading4.$set(heading4_changes);
    			const heading5_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				heading5_changes.$$scope = { dirty, ctx };
    			}

    			heading5.$set(heading5_changes);
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(heading0.$$.fragment, local);
    			transition_in(heading1.$$.fragment, local);
    			transition_in(heading2.$$.fragment, local);
    			transition_in(heading3.$$.fragment, local);
    			transition_in(heading4.$$.fragment, local);
    			transition_in(heading5.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(heading0.$$.fragment, local);
    			transition_out(heading1.$$.fragment, local);
    			transition_out(heading2.$$.fragment, local);
    			transition_out(heading3.$$.fragment, local);
    			transition_out(heading4.$$.fragment, local);
    			transition_out(heading5.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(heading0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(heading1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(heading2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(heading3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(heading4, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(heading5, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_26.name,
    		type: "slot",
    		source: "(72:2) <Card cardEsc hasFooter>",
    		ctx
    	});

    	return block;
    }

    // (23:0) <Examples   title="Headings"   introduction="MUI provides base-level styling for Native HTML elements through   the optional mui-base.css . It doesn't supply the consumer with modifier   classes to customise the user interface. However, consumers are able to modify   MUI web components by assigning defined attributes, which can be found within   the Web component documentation.">
    function create_default_slot_25(ctx) {
    	let t0;
    	let t1;
    	let current;

    	const card0 = new Card({
    			props: {
    				cardEsc: true,
    				hasFooter: true,
    				$$slots: { default: [create_default_slot_42] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const card1 = new Card({
    			props: {
    				cardEsc: true,
    				hasFooter: true,
    				$$slots: { default: [create_default_slot_34] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const card2 = new Card({
    			props: {
    				cardEsc: true,
    				hasFooter: true,
    				$$slots: { default: [create_default_slot_26] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card0.$$.fragment);
    			t0 = space();
    			create_component(card1.$$.fragment);
    			t1 = space();
    			create_component(card2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(card0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(card1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(card2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const card0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card0_changes.$$scope = { dirty, ctx };
    			}

    			card0.$set(card0_changes);
    			const card1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card1_changes.$$scope = { dirty, ctx };
    			}

    			card1.$set(card1_changes);
    			const card2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card2_changes.$$scope = { dirty, ctx };
    			}

    			card2.$set(card2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card0.$$.fragment, local);
    			transition_in(card1.$$.fragment, local);
    			transition_in(card2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card0.$$.fragment, local);
    			transition_out(card1.$$.fragment, local);
    			transition_out(card2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(card1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(card2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_25.name,
    		type: "slot",
    		source: "(23:0) <Examples   title=\\\"Headings\\\"   introduction=\\\"MUI provides base-level styling for Native HTML elements through   the optional mui-base.css . It doesn't supply the consumer with modifier   classes to customise the user interface. However, consumers are able to modify   MUI web components by assigning defined attributes, which can be found within   the Web component documentation.\\\">",
    		ctx
    	});

    	return block;
    }

    // (105:6) <Button primary>
    function create_default_slot_24(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Save");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_24.name,
    		type: "slot",
    		source: "(105:6) <Button primary>",
    		ctx
    	});

    	return block;
    }

    // (106:6) <Button secondary>
    function create_default_slot_23(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cancel");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_23.name,
    		type: "slot",
    		source: "(106:6) <Button secondary>",
    		ctx
    	});

    	return block;
    }

    // (107:6) <Button warning>
    function create_default_slot_22(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Delete");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_22.name,
    		type: "slot",
    		source: "(107:6) <Button warning>",
    		ctx
    	});

    	return block;
    }

    // (104:4) <ButtonGroup col="3">
    function create_default_slot_21(ctx) {
    	let t0;
    	let t1;
    	let current;

    	const button0 = new Button({
    			props: {
    				primary: true,
    				$$slots: { default: [create_default_slot_24] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button1 = new Button({
    			props: {
    				secondary: true,
    				$$slots: { default: [create_default_slot_23] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button2 = new Button({
    			props: {
    				warning: true,
    				$$slots: { default: [create_default_slot_22] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			t0 = space();
    			create_component(button1.$$.fragment);
    			t1 = space();
    			create_component(button2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(button1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(button2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(button1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(button2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_21.name,
    		type: "slot",
    		source: "(104:4) <ButtonGroup col=\\\"3\\\">",
    		ctx
    	});

    	return block;
    }

    // (109:4) <Code codeEsc>
    function create_default_slot_20(ctx) {
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let br2;
    	let t3;
    	let br3;
    	let t4;

    	const block = {
    		c: function create() {
    			t0 = text("<ButtonGroup col=\"3\">\n      ");
    			br0 = element("br");
    			t1 = text("\n        <Button primary>Hello</Button>\n      ");
    			br1 = element("br");
    			t2 = text("\n        <Button secondary>Hello</Button>\n      ");
    			br2 = element("br");
    			t3 = text("\n        <Button warning>Hello</Button>\n      ");
    			br3 = element("br");
    			t4 = text("\n      </ButtonGroup>");
    			attr_dev(br0, "class", "svelte-1nw7k6q");
    			add_location(br0, file$7, 110, 6, 4131);
    			attr_dev(br1, "class", "svelte-1nw7k6q");
    			add_location(br1, file$7, 112, 6, 4205);
    			attr_dev(br2, "class", "svelte-1nw7k6q");
    			add_location(br2, file$7, 114, 6, 4281);
    			attr_dev(br3, "class", "svelte-1nw7k6q");
    			add_location(br3, file$7, 116, 6, 4355);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t4, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_20.name,
    		type: "slot",
    		source: "(109:4) <Code codeEsc>",
    		ctx
    	});

    	return block;
    }

    // (102:2) <Card cardEsc hasFooter>
    function create_default_slot_19(ctx) {
    	let h3;
    	let t1;
    	let t2;
    	let current;

    	const buttongroup = new ButtonGroup({
    			props: {
    				col: "3",
    				$$slots: { default: [create_default_slot_21] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const code = new Code({
    			props: {
    				codeEsc: true,
    				$$slots: { default: [create_default_slot_20] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Square";
    			t1 = space();
    			create_component(buttongroup.$$.fragment);
    			t2 = space();
    			create_component(code.$$.fragment);
    			attr_dev(h3, "class", "svelte-1nw7k6q");
    			add_location(h3, file$7, 102, 4, 3897);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(buttongroup, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const buttongroup_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				buttongroup_changes.$$scope = { dirty, ctx };
    			}

    			buttongroup.$set(buttongroup_changes);
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttongroup.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttongroup.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			destroy_component(buttongroup, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_19.name,
    		type: "slot",
    		source: "(102:2) <Card cardEsc hasFooter>",
    		ctx
    	});

    	return block;
    }

    // (124:6) <Button rounded primary>
    function create_default_slot_18(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Save");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_18.name,
    		type: "slot",
    		source: "(124:6) <Button rounded primary>",
    		ctx
    	});

    	return block;
    }

    // (125:6) <Button rounded secondary>
    function create_default_slot_17(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cancel");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_17.name,
    		type: "slot",
    		source: "(125:6) <Button rounded secondary>",
    		ctx
    	});

    	return block;
    }

    // (126:6) <Button rounded warning>
    function create_default_slot_16(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Delete");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_16.name,
    		type: "slot",
    		source: "(126:6) <Button rounded warning>",
    		ctx
    	});

    	return block;
    }

    // (123:4) <ButtonGroup col="3">
    function create_default_slot_15(ctx) {
    	let t0;
    	let t1;
    	let current;

    	const button0 = new Button({
    			props: {
    				rounded: true,
    				primary: true,
    				$$slots: { default: [create_default_slot_18] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button1 = new Button({
    			props: {
    				rounded: true,
    				secondary: true,
    				$$slots: { default: [create_default_slot_17] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button2 = new Button({
    			props: {
    				rounded: true,
    				warning: true,
    				$$slots: { default: [create_default_slot_16] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			t0 = space();
    			create_component(button1.$$.fragment);
    			t1 = space();
    			create_component(button2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(button1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(button2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(button1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(button2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_15.name,
    		type: "slot",
    		source: "(123:4) <ButtonGroup col=\\\"3\\\">",
    		ctx
    	});

    	return block;
    }

    // (128:4) <Code codeEsc>
    function create_default_slot_14(ctx) {
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let br2;
    	let t3;
    	let br3;
    	let t4;

    	const block = {
    		c: function create() {
    			t0 = text("<ButtonGroup col=\"3\">\n      ");
    			br0 = element("br");
    			t1 = text("\n        <Button rounded primary>Hello</Button>\n      ");
    			br1 = element("br");
    			t2 = text("\n        <Button rounded secondary>Hello</Button>\n      ");
    			br2 = element("br");
    			t3 = text("\n        <Button rounded warning>Hello</Button>\n      ");
    			br3 = element("br");
    			t4 = text("\n      </ButtonGroup>");
    			attr_dev(br0, "class", "svelte-1nw7k6q");
    			add_location(br0, file$7, 129, 6, 4701);
    			attr_dev(br1, "class", "svelte-1nw7k6q");
    			add_location(br1, file$7, 131, 6, 4783);
    			attr_dev(br2, "class", "svelte-1nw7k6q");
    			add_location(br2, file$7, 133, 6, 4867);
    			attr_dev(br3, "class", "svelte-1nw7k6q");
    			add_location(br3, file$7, 135, 6, 4949);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t4, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_14.name,
    		type: "slot",
    		source: "(128:4) <Code codeEsc>",
    		ctx
    	});

    	return block;
    }

    // (121:2) <Card cardEsc hasFooter>
    function create_default_slot_13(ctx) {
    	let h3;
    	let t1;
    	let t2;
    	let current;

    	const buttongroup = new ButtonGroup({
    			props: {
    				col: "3",
    				$$slots: { default: [create_default_slot_15] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const code = new Code({
    			props: {
    				codeEsc: true,
    				$$slots: { default: [create_default_slot_14] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Rounded";
    			t1 = space();
    			create_component(buttongroup.$$.fragment);
    			t2 = space();
    			create_component(code.$$.fragment);
    			attr_dev(h3, "class", "svelte-1nw7k6q");
    			add_location(h3, file$7, 121, 4, 4442);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(buttongroup, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const buttongroup_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				buttongroup_changes.$$scope = { dirty, ctx };
    			}

    			buttongroup.$set(buttongroup_changes);
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttongroup.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttongroup.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			destroy_component(buttongroup, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_13.name,
    		type: "slot",
    		source: "(121:2) <Card cardEsc hasFooter>",
    		ctx
    	});

    	return block;
    }

    // (143:6) <Button primary>
    function create_default_slot_12(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Save");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_12.name,
    		type: "slot",
    		source: "(143:6) <Button primary>",
    		ctx
    	});

    	return block;
    }

    // (144:6) <Button secondary>
    function create_default_slot_11(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cancel");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_11.name,
    		type: "slot",
    		source: "(144:6) <Button secondary>",
    		ctx
    	});

    	return block;
    }

    // (145:6) <Button warning>
    function create_default_slot_10(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Delete");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_10.name,
    		type: "slot",
    		source: "(145:6) <Button warning>",
    		ctx
    	});

    	return block;
    }

    // (142:4) <ButtonGroup col="3" isRightAligned>
    function create_default_slot_9(ctx) {
    	let t0;
    	let t1;
    	let current;

    	const button0 = new Button({
    			props: {
    				primary: true,
    				$$slots: { default: [create_default_slot_12] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button1 = new Button({
    			props: {
    				secondary: true,
    				$$slots: { default: [create_default_slot_11] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button2 = new Button({
    			props: {
    				warning: true,
    				$$slots: { default: [create_default_slot_10] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			t0 = space();
    			create_component(button1.$$.fragment);
    			t1 = space();
    			create_component(button2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(button1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(button2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(button1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(button2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(142:4) <ButtonGroup col=\\\"3\\\" isRightAligned>",
    		ctx
    	});

    	return block;
    }

    // (147:4) <Code codeEsc>
    function create_default_slot_8(ctx) {
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let br2;
    	let t3;
    	let br3;
    	let t4;

    	const block = {
    		c: function create() {
    			t0 = text("<ButtonGroup col=\"3\" isRightAligned>\n      ");
    			br0 = element("br");
    			t1 = text("\n        <Button primary>Hello</Button>\n      ");
    			br1 = element("br");
    			t2 = text("\n        <Button secondary>Hello</Button>\n      ");
    			br2 = element("br");
    			t3 = text("\n        <Button warning>Hello</Button>\n      ");
    			br3 = element("br");
    			t4 = text("\n      </ButtonGroup>");
    			attr_dev(br0, "class", "svelte-1nw7k6q");
    			add_location(br0, file$7, 148, 6, 5300);
    			attr_dev(br1, "class", "svelte-1nw7k6q");
    			add_location(br1, file$7, 150, 6, 5374);
    			attr_dev(br2, "class", "svelte-1nw7k6q");
    			add_location(br2, file$7, 152, 6, 5450);
    			attr_dev(br3, "class", "svelte-1nw7k6q");
    			add_location(br3, file$7, 154, 6, 5524);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t4, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(147:4) <Code codeEsc>",
    		ctx
    	});

    	return block;
    }

    // (140:2) <Card cardEsc hasFooter>
    function create_default_slot_7(ctx) {
    	let h3;
    	let t1;
    	let t2;
    	let current;

    	const buttongroup = new ButtonGroup({
    			props: {
    				col: "3",
    				isRightAligned: true,
    				$$slots: { default: [create_default_slot_9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const code = new Code({
    			props: {
    				codeEsc: true,
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Square";
    			t1 = space();
    			create_component(buttongroup.$$.fragment);
    			t2 = space();
    			create_component(code.$$.fragment);
    			attr_dev(h3, "class", "svelte-1nw7k6q");
    			add_location(h3, file$7, 140, 4, 5036);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(buttongroup, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const buttongroup_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				buttongroup_changes.$$scope = { dirty, ctx };
    			}

    			buttongroup.$set(buttongroup_changes);
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttongroup.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttongroup.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			destroy_component(buttongroup, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(140:2) <Card cardEsc hasFooter>",
    		ctx
    	});

    	return block;
    }

    // (162:6) <Button rounded primary>
    function create_default_slot_6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Save");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(162:6) <Button rounded primary>",
    		ctx
    	});

    	return block;
    }

    // (163:6) <Button rounded secondary>
    function create_default_slot_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cancel");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(163:6) <Button rounded secondary>",
    		ctx
    	});

    	return block;
    }

    // (164:6) <Button rounded warning>
    function create_default_slot_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Delete");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(164:6) <Button rounded warning>",
    		ctx
    	});

    	return block;
    }

    // (161:4) <ButtonGroup col="3" isRightAligned>
    function create_default_slot_3(ctx) {
    	let t0;
    	let t1;
    	let current;

    	const button0 = new Button({
    			props: {
    				rounded: true,
    				primary: true,
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button1 = new Button({
    			props: {
    				rounded: true,
    				secondary: true,
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button2 = new Button({
    			props: {
    				rounded: true,
    				warning: true,
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			t0 = space();
    			create_component(button1.$$.fragment);
    			t1 = space();
    			create_component(button2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(button1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(button2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(button1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(button2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(161:4) <ButtonGroup col=\\\"3\\\" isRightAligned>",
    		ctx
    	});

    	return block;
    }

    // (166:4) <Code codeEsc>
    function create_default_slot_2$1(ctx) {
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let br2;
    	let t3;
    	let br3;
    	let t4;

    	const block = {
    		c: function create() {
    			t0 = text("<ButtonGroup col=\"3\" isRightAligned>\n      ");
    			br0 = element("br");
    			t1 = text("\n        <Button rounded primary>Hello</Button>\n      ");
    			br1 = element("br");
    			t2 = text("\n        <Button rounded secondary>Hello</Button>\n      ");
    			br2 = element("br");
    			t3 = text("\n        <Button rounded warning>Hello</Button>\n      ");
    			br3 = element("br");
    			t4 = text("\n      </ButtonGroup>");
    			attr_dev(br0, "class", "svelte-1nw7k6q");
    			add_location(br0, file$7, 167, 6, 5900);
    			attr_dev(br1, "class", "svelte-1nw7k6q");
    			add_location(br1, file$7, 169, 6, 5982);
    			attr_dev(br2, "class", "svelte-1nw7k6q");
    			add_location(br2, file$7, 171, 6, 6066);
    			attr_dev(br3, "class", "svelte-1nw7k6q");
    			add_location(br3, file$7, 173, 6, 6148);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t4, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(166:4) <Code codeEsc>",
    		ctx
    	});

    	return block;
    }

    // (159:2) <Card cardEsc hasFooter>
    function create_default_slot_1$1(ctx) {
    	let h3;
    	let t1;
    	let t2;
    	let current;

    	const buttongroup = new ButtonGroup({
    			props: {
    				col: "3",
    				isRightAligned: true,
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const code = new Code({
    			props: {
    				codeEsc: true,
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Rounded";
    			t1 = space();
    			create_component(buttongroup.$$.fragment);
    			t2 = space();
    			create_component(code.$$.fragment);
    			attr_dev(h3, "class", "svelte-1nw7k6q");
    			add_location(h3, file$7, 159, 4, 5611);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(buttongroup, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const buttongroup_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				buttongroup_changes.$$scope = { dirty, ctx };
    			}

    			buttongroup.$set(buttongroup_changes);
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttongroup.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttongroup.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			destroy_component(buttongroup, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(159:2) <Card cardEsc hasFooter>",
    		ctx
    	});

    	return block;
    }

    // (95:0) <Examples   title="Buttons"   introduction="MUI provides base-level styling for Native HTML elements through   the optional mui-base.css . It doesn't supply the consumer with modifier   classes to customise the user interface. However, consumers are able to modify   MUI web components by assigning defined attributes, which can be found within   the Web component documentation.">
    function create_default_slot$1(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let current;

    	const card0 = new Card({
    			props: {
    				cardEsc: true,
    				hasFooter: true,
    				$$slots: { default: [create_default_slot_19] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const card1 = new Card({
    			props: {
    				cardEsc: true,
    				hasFooter: true,
    				$$slots: { default: [create_default_slot_13] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const card2 = new Card({
    			props: {
    				cardEsc: true,
    				hasFooter: true,
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const card3 = new Card({
    			props: {
    				cardEsc: true,
    				hasFooter: true,
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card0.$$.fragment);
    			t0 = space();
    			create_component(card1.$$.fragment);
    			t1 = space();
    			create_component(card2.$$.fragment);
    			t2 = space();
    			create_component(card3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(card0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(card1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(card2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(card3, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const card0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card0_changes.$$scope = { dirty, ctx };
    			}

    			card0.$set(card0_changes);
    			const card1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card1_changes.$$scope = { dirty, ctx };
    			}

    			card1.$set(card1_changes);
    			const card2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card2_changes.$$scope = { dirty, ctx };
    			}

    			card2.$set(card2_changes);
    			const card3_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card3_changes.$$scope = { dirty, ctx };
    			}

    			card3.$set(card3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card0.$$.fragment, local);
    			transition_in(card1.$$.fragment, local);
    			transition_in(card2.$$.fragment, local);
    			transition_in(card3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card0.$$.fragment, local);
    			transition_out(card1.$$.fragment, local);
    			transition_out(card2.$$.fragment, local);
    			transition_out(card3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(card1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(card2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(card3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(95:0) <Examples   title=\\\"Buttons\\\"   introduction=\\\"MUI provides base-level styling for Native HTML elements through   the optional mui-base.css . It doesn't supply the consumer with modifier   classes to customise the user interface. However, consumers are able to modify   MUI web components by assigning defined attributes, which can be found within   the Web component documentation.\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let t;
    	let current;

    	const examples0 = new Examples({
    			props: {
    				title: "Headings",
    				introduction: "MUI provides base-level styling for Native HTML elements through\n  the optional mui-base.css . It doesn't supply the consumer with modifier\n  classes to customise the user interface. However, consumers are able to modify\n  MUI web components by assigning defined attributes, which can be found within\n  the Web component documentation.",
    				$$slots: { default: [create_default_slot_25] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const examples1 = new Examples({
    			props: {
    				title: "Buttons",
    				introduction: "MUI provides base-level styling for Native HTML elements through\n  the optional mui-base.css . It doesn't supply the consumer with modifier\n  classes to customise the user interface. However, consumers are able to modify\n  MUI web components by assigning defined attributes, which can be found within\n  the Web component documentation.",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(examples0.$$.fragment);
    			t = space();
    			create_component(examples1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(examples0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(examples1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const examples0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				examples0_changes.$$scope = { dirty, ctx };
    			}

    			examples0.$set(examples0_changes);
    			const examples1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				examples1_changes.$$scope = { dirty, ctx };
    			}

    			examples1.$set(examples1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(examples0.$$.fragment, local);
    			transition_in(examples1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(examples0.$$.fragment, local);
    			transition_out(examples1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(examples0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(examples1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
      props: {
        name: "world"
      }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
