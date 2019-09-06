import React from 'react';
import Gallery from '../src/components/Gallery'
import renderer from 'react-test-renderer';
const images = [
    {
        original: require('~/assets/image/1.jpg'),
        originalAlt: '',
        description: 'first picture'
    },
    {
        original: require('~/assets/image/2.jpg'),
        originalAlt: '',
        description: 'second picture'
    },
    {
        original: require('~/assets/image/3.jpg'),
        originalAlt: '',
        description: 'third picture'
    }
];
test('render gallery image', () => {
    const component = renderer.create(
        <Gallery items={images} />,
    );
    console.log(component)
    // const imgDoms = container.querySelector('img');
    // expect(imgDoms.length).toBe(3);
});